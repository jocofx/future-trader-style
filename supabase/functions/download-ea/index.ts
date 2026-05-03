// Supabase Edge Function — Download EA (MQ5/MQ4)
// GET /functions/v1/download-ea?platform=mt5&token=xxx

const MT5_TEMPLATE = String.raw`//+------------------------------------------------------------------+
//|                                           TradyncSync_MT5.mq5    |
//|          Sync + Gestor de Riesgo + Analisis Conductual           |
//|                                  https://tradyncapp.com           |
//+------------------------------------------------------------------+
#property copyright "TradyncApp.com"
#property link      "https://tradyncapp.com"
#property version   "6.02"
#property strict

//+------------------------------------------------------------------+
//| PARAMETROS DE ENTRADA (valores por defecto al instalar)          |
//+------------------------------------------------------------------+
input group "=== SINCRONIZACION ==="
input int    SyncInterval              = 3;
input bool   EnableLogs                = true;

input group "=== GESTOR DE RIESGO ==="
input bool   EnableRiskManager         = true;
input int    MaxOps_Inicial            = 0;
input double LimGanancia_Inicial       = 0;
input double LimPerdida_Inicial        = 0;
input int    HoraInicio_Inicial        = 0;
input int    HoraFin_Inicial           = 0;

input group "=== ANALISIS CONDUCTUAL ==="
input bool   ActivarAnalisisConductual = true;
input string SensibilidadSistema       = "medium";
input bool   ActivarFeedback           = true;
input bool   ActivarModoRestrictivo    = false;
input int    LimiteBloqueoScore        = 30;
input int    DecadenciaPuntosDia       = 2;
input int    MinutosEntreOpsImpulsivo  = 5;

//+------------------------------------------------------------------+
//| VARIABLES GLOBALES                                               |
//+------------------------------------------------------------------+
string TOKEN    = "%%TOKEN%%";
string ENDPOINT = "https://oeznlehxublyvivzvuab.supabase.co/functions/v1/ea-api";

// Mutable runtime copies — Tradyncapp puede sobreescribirlos en tiempo real
int    MaxOperacionesDiarias = 0;
double LimiteGananciaDiaria  = 0;
double LimitePerdidaDiaria   = 0;
int    HoraInicio            = 0;
int    HoraFin               = 0;

struct PosCache { ulong ticket; double sl; double tp; double vol; };
PosCache posCache[];
ulong    sentTickets[];

ulong  ticketsValidosHoy[];
int    contadorValidosHoy;
string diaActual;
double balanceInicio;
bool   limitePerdidaAlcanzado;
bool   limiteGananciaAlcanzado;

string GV_SCORE      = "TRADYNC_SCORE";
string GV_LAST_CLOSE = "TRADYNC_LAST_CLOSE";
string GV_LAST_DECAY = "TRADYNC_LAST_DECAY";
string GV_LAST_BLOCK = "TRADYNC_LAST_BLOCK";

double   scoreActual;
int      violacionesHoy;
datetime ultimaCierre;
int      reintentosBloqueo;
double   multScore;

//+------------------------------------------------------------------+
//| UTILIDADES BASICAS                                               |
//+------------------------------------------------------------------+
void Log(string msg) { if(EnableLogs) Print("TradyncSync: " + msg); }

string EscJ(string s) {
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\n", "\\n");
   return s;
}

string FmtDT(datetime dt) {
   MqlDateTime m;
   TimeToStruct(dt, m);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       m.year, m.mon, m.day, m.hour, m.min, m.sec);
}

bool Changed(ulong tk, PosCache &p) {
   for(int i = 0; i < ArraySize(posCache); i++)
      if(posCache[i].ticket == tk)
         return MathAbs(posCache[i].sl  - p.sl)  > 0.00001 ||
                MathAbs(posCache[i].tp  - p.tp)  > 0.00001 ||
                MathAbs(posCache[i].vol - p.vol) > 0.00001;
   return true;
}

bool Sent(ulong tk) {
   for(int i = 0; i < ArraySize(sentTickets); i++)
      if(sentTickets[i] == tk) return true;
   return false;
}

void MarkSent(ulong tk) {
   int s = ArraySize(sentTickets);
   ArrayResize(sentTickets, s + 1);
   sentTickets[s] = tk;
}

string Post(string url, string body) {
   string headers = "Content-Type: application/json\r\n"
                  + "X-Auth-Token: " + TOKEN + "\r\n"
                  + "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lem5sZWh4dWJseXZpdnp2dWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjUzMDQsImV4cCI6MjA5MTc0MTMwNH0.OJQRGgV0W64tJcrgQIos_C5e3RD8gsUtEem09LTtEhpE\r\n"
                  + "Accept: application/json\r\n";
   uchar post[], result[];
   string rh;
   StringToCharArray(body, post, 0, WHOLE_ARRAY, CP_UTF8);
   int sz = ArraySize(post);
   if(sz > 0 && post[sz-1] == 0) ArrayResize(post, sz - 1);
   ResetLastError();
   int res = WebRequest("POST", url, headers, 5000, post, result, rh);
   if(res == -1) {
      int err = GetLastError();
      Log("HTTP ERROR " + IntegerToString(err));
      if(err == 4060)
         Alert("Activa WebRequests para: " + ENDPOINT);
      return "";
   }
   return CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
}

//+------------------------------------------------------------------+
//| SINCRONIZACION CON TRADYNCAPP                                    |
//| Extrae un campo numerico de un JSON: {"campo":123,...}           |
//+------------------------------------------------------------------+
string JsonGetStr(string json, string campo) {
   string buscar = "\"" + campo + "\":";
   int pos = StringFind(json, buscar);
   if(pos < 0) return "";
   pos += StringLen(buscar);
   // Skip optional quote for string values
   if(StringGetCharacter(json, pos) == '"') pos++;
   string raw = "";
   for(int i = pos; i < pos + 20 && i < StringLen(json); i++) {
      ushort c = StringGetCharacter(json, i);
      if(c == ',' || c == '}' || c == '"' || c == ' ' || c == '\n' || c == '\r') break;
      raw += ShortToString(c);
   }
   return raw;
}

void AplicarRiskConfig(string resp) {
   if(StringLen(resp) < 10)           return;
   if(StringFind(resp, "risk_config") < 0) return;

   string sOps = JsonGetStr(resp, "max_ops_dia");
   string sPer = JsonGetStr(resp, "limite_perdida");
   string sGan = JsonGetStr(resp, "limite_ganancia");
   string sHIn = JsonGetStr(resp, "hora_inicio");
   string sHFn = JsonGetStr(resp, "hora_fin");

   if(StringLen(sOps) > 0) MaxOperacionesDiarias = (int)StringToInteger(sOps);
   if(StringLen(sPer) > 0) LimitePerdidaDiaria   = StringToDouble(sPer);
   if(StringLen(sGan) > 0) LimiteGananciaDiaria  = StringToDouble(sGan);
   if(StringLen(sHIn) > 0) HoraInicio            = (int)StringToInteger(sHIn);
   if(StringLen(sHFn) > 0) HoraFin               = (int)StringToInteger(sHFn);

   Log("Config Tradyncapp: MaxOps="  + IntegerToString(MaxOperacionesDiarias)
       + " Perdida="   + DoubleToString(LimitePerdidaDiaria,  0)
       + " Ganancia="  + DoubleToString(LimiteGananciaDiaria, 0)
       + " Horario="   + IntegerToString(HoraInicio) + "-" + IntegerToString(HoraFin));
}

//+------------------------------------------------------------------+
//| PERFIL CONDUCTUAL                                                |
//+------------------------------------------------------------------+
string GetPerfil() {
   if(scoreActual <= 5)  return "Disciplinado";
   if(scoreActual <= 10) return "Levemente impulsivo";
   if(scoreActual <= 20) return "Indisciplinado";
   if(scoreActual <= 35) return "Alto riesgo";
   return "Trading compulsivo";
}

int GetIndiceDisciplina() {
   int i = 100 - (int)scoreActual;
   if(i < 0)   i = 0;
   if(i > 100) i = 100;
   return i;
}

void Feedback(string ev, int extra) {
   if(!ActivarFeedback) return;
   string msg = "";
   if(ev == "EXCESO_OPS")
      msg = "Ha superado el limite diario. Score: " + DoubleToString(scoreActual, 0);
   else if(ev == "OPERATIVA_TRAS_PERDIDA")
      msg = "Posible revenge trading. Toma un descanso.";
   else if(ev == "OVERTRADING")
      msg = "Sobreoperacion detectada.";
   else if(ev == "IMPULSIVIDAD")
      msg = "Operacion impulsiva. Menos de " + IntegerToString(MinutosEntreOpsImpulsivo) + " min entre ops.";
   else if(ev == "FUERA_HORARIO")
      msg = "Operacion fuera del horario permitido.";
   else if(ev == "BLOQUEO_ACTIVO")
      msg = "Modo restrictivo. Score " + DoubleToString(scoreActual, 0)
            + " >= " + IntegerToString(LimiteBloqueoScore);
   else if(ev == "DIA_CORRECTO" && extra >= 1)
      msg = IntegerToString(extra) + " dia(s) correctos. Disciplina: "
            + IntegerToString(GetIndiceDisciplina()) + "/100";
   if(msg != "") Print("TradyncSync FEEDBACK: " + msg);
}

void AnadirScore(double pts, string ev) {
   double p = pts * multScore;
   scoreActual += p;
   if(scoreActual < 0) scoreActual = 0;
   violacionesHoy++;
   GlobalVariableSet(GV_SCORE, scoreActual);
   Log("CONDUCTUAL [" + ev + "] +" + DoubleToString(p, 1)
       + " Score: " + DoubleToString(scoreActual, 1)
       + " Perfil: " + GetPerfil());
   Feedback(ev, 0);
}

//+------------------------------------------------------------------+
//| DECAIMIENTO DIARIO                                               |
//+------------------------------------------------------------------+
void AplicarDecaimiento() {
   if(DecadenciaPuntosDia <= 0) return;
   datetime ahora      = TimeCurrent();
   datetime ultimoDecay = 0;
   if(GlobalVariableCheck(GV_LAST_DECAY))
      ultimoDecay = (datetime)GlobalVariableGet(GV_LAST_DECAY);
   if(ultimoDecay > 0) {
      MqlDateTime dt1, dt2;
      TimeToStruct(ultimoDecay, dt1);
      TimeToStruct(ahora, dt2);
      int dias = dt2.day_of_year - dt1.day_of_year;
      if(dt2.year > dt1.year) dias += 365;
      if(dias > 0) {
         scoreActual = MathMax(0, scoreActual - dias * DecadenciaPuntosDia);
         GlobalVariableSet(GV_SCORE, scoreActual);
         GlobalVariableSet(GV_LAST_DECAY, (double)ahora);
         if(dias >= 1) Feedback("DIA_CORRECTO", dias);
      }
   } else {
      GlobalVariableSet(GV_LAST_DECAY, (double)ahora);
   }
}

void InicializarConductual() {
   scoreActual  = GlobalVariableCheck(GV_SCORE)      ? GlobalVariableGet(GV_SCORE)                  : 0;
   ultimaCierre = GlobalVariableCheck(GV_LAST_CLOSE) ? (datetime)GlobalVariableGet(GV_LAST_CLOSE)   : 0;
   violacionesHoy    = 0;
   reintentosBloqueo = 0;
   AplicarDecaimiento();
}

void CheckImpulsividad(datetime openTime) {
   if(ultimaCierre == 0 || MinutosEntreOpsImpulsivo <= 0) return;
   int seg = (int)(openTime - ultimaCierre);
   if(seg > 0 && seg < MinutosEntreOpsImpulsivo * 60)
      AnadirScore(1, "IMPULSIVIDAD");
}

//+------------------------------------------------------------------+
//| GESTION DEL DIA                                                  |
//+------------------------------------------------------------------+
void InicializarDia() {
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   diaActual              = StringFormat("%04d.%02d.%02d", dt.year, dt.mon, dt.day);
   balanceInicio          = AccountInfoDouble(ACCOUNT_BALANCE);
   limitePerdidaAlcanzado  = false;
   limiteGananciaAlcanzado = false;
   ArrayResize(ticketsValidosHoy, 0);
   contadorValidosHoy = 0;
   violacionesHoy     = 0;
   Log("Nuevo dia: " + diaActual + " Score: " + DoubleToString(scoreActual, 1));
}

void VerificarCambioDia() {
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   string hoy = StringFormat("%04d.%02d.%02d", dt.year, dt.mon, dt.day);
   if(hoy != diaActual) { AplicarDecaimiento(); InicializarDia(); }
}

//+------------------------------------------------------------------+
//| CERRAR POSICIONES                                                |
//+------------------------------------------------------------------+
bool CerrarPosicion(ulong ticket, string motivo) {
   if(!PositionSelectByTicket(ticket)) return false;
   MqlTradeRequest rq;
   MqlTradeResult  rs;
   ZeroMemory(rq); ZeroMemory(rs);
   rq.action    = TRADE_ACTION_DEAL;
   rq.position  = ticket;
   rq.symbol    = PositionGetString(POSITION_SYMBOL);
   rq.volume    = PositionGetDouble(POSITION_VOLUME);
   rq.type      = (ENUM_ORDER_TYPE)(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY
                   ? ORDER_TYPE_SELL : ORDER_TYPE_BUY);
   rq.price     = (rq.type == ORDER_TYPE_SELL)
                   ? SymbolInfoDouble(rq.symbol, SYMBOL_BID)
                   : SymbolInfoDouble(rq.symbol, SYMBOL_ASK);
   rq.deviation = 30;
   rq.comment   = "TradyncApp: " + motivo;
   bool ok = OrderSend(rq, rs);
   if(ok) Log("Cerrado: " + IntegerToString(ticket) + " | " + motivo);
   else   Log("Error cerrando " + IntegerToString(ticket));
   return ok;
}

void CerrarTodas(string motivo) {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong tk = PositionGetTicket(i);
      if(tk > 0) CerrarPosicion(tk, motivo);
   }
}

//+------------------------------------------------------------------+
//| SINCRONIZACION CON SERVIDOR                                      |
//+------------------------------------------------------------------+
void RegisterAccount() {
   string tipo = ((ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE)
                  == ACCOUNT_TRADE_MODE_DEMO) ? "demo" : "real";
   string j = "{"
      + "\"account_number\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ","
      + "\"broker\":\""       + EscJ(AccountInfoString(ACCOUNT_COMPANY)) + "\","
      + "\"server\":\""       + EscJ(AccountInfoString(ACCOUNT_SERVER))  + "\","
      + "\"currency\":\""     + EscJ(AccountInfoString(ACCOUNT_CURRENCY)) + "\","
      + "\"leverage\":"       + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE)) + ","
      + "\"balance\":"        + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
      + "\"platform\":\"MT5\","
      + "\"account_type\":\"" + tipo + "\","
      + "\"score\":"          + DoubleToString(scoreActual, 1) + ","
      + "\"perfil\":\""       + GetPerfil() + "\""
      + "}";
   string respReg = Post(ENDPOINT + "/mt-register", j);
   Log("Cuenta registrada: " + respReg);
   AplicarRiskConfig(respReg);
}

void SendPos(ulong tk) {
   if(!PositionSelectByTicket(tk)) return;
   string tipo = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "BUY" : "SELL";
   string j = "{"
      + "\"ticket\":"      + IntegerToString(tk) + ","
      + "\"symbol\":\""    + EscJ(PositionGetString(POSITION_SYMBOL)) + "\","
      + "\"type\":\""      + tipo + "\","
      + "\"volume\":"      + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ","
      + "\"open_price\":"  + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ","
      + "\"sl\":"          + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ","
      + "\"tp\":"          + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ","
      + "\"open_time\":\"" + FmtDT((datetime)PositionGetInteger(POSITION_TIME)) + "\","
      + "\"profit\":"      + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ","
      + "\"swap\":"        + DoubleToString(PositionGetDouble(POSITION_SWAP), 2) + ","
      + "\"account\":"     + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))
      + "}";
   string respSync = Post(ENDPOINT + "/mt-sync", j);
   if(StringFind(respSync, "stop") >= 0 || StringFind(respSync, "close_all") >= 0)
      CerrarTodas("Solicitud servidor");
   AplicarRiskConfig(respSync);
   Log("Sync ticket=" + IntegerToString(tk));
}

void SyncPositions(bool force) {
   int total = PositionsTotal();
   PosCache current[];
   ArrayResize(current, total);
   for(int i = 0; i < total; i++) {
      ulong tk = PositionGetTicket(i);
      if(!tk || !PositionSelectByTicket(tk)) continue;
      current[i].ticket = tk;
      current[i].sl     = PositionGetDouble(POSITION_SL);
      current[i].tp     = PositionGetDouble(POSITION_TP);
      current[i].vol    = PositionGetDouble(POSITION_VOLUME);
      if(force || Changed(tk, current[i])) SendPos(tk);
   }
   ArrayCopy(posCache, current);
}

void SendClosed(ulong dk) {
   ulong    posId = HistoryDealGetInteger(dk, DEAL_POSITION_ID);
   double   openPx = 0;
   datetime openT  = 0;
   string   tipo   = "BUY";
   HistorySelectByPosition(posId);
   for(int j = 0; j < HistoryDealsTotal(); j++) {
      ulong d = HistoryDealGetTicket(j);
      if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(d, DEAL_ENTRY) == DEAL_ENTRY_IN) {
         openPx = HistoryDealGetDouble(d, DEAL_PRICE);
         openT  = (datetime)HistoryDealGetInteger(d, DEAL_TIME);
         tipo   = (HistoryDealGetInteger(d, DEAL_TYPE) == DEAL_TYPE_BUY) ? "BUY" : "SELL";
         break;
      }
   }
   string j = "{"
      + "\"ticket\":"      + IntegerToString(posId) + ","
      + "\"symbol\":\""    + EscJ(HistoryDealGetString(dk, DEAL_SYMBOL)) + "\","
      + "\"type\":\""      + tipo + "\","
      + "\"volume\":"      + DoubleToString(HistoryDealGetDouble(dk, DEAL_VOLUME), 2) + ","
      + "\"open_price\":"  + DoubleToString(openPx, 5) + ","
      + "\"close_price\":" + DoubleToString(HistoryDealGetDouble(dk, DEAL_PRICE), 5) + ","
      + "\"open_time\":\"" + FmtDT(openT) + "\","
      + "\"close_time\":\"" + FmtDT((datetime)HistoryDealGetInteger(dk, DEAL_TIME)) + "\","
      + "\"profit\":"      + DoubleToString(HistoryDealGetDouble(dk, DEAL_PROFIT), 2) + ","
      + "\"swap\":"        + DoubleToString(HistoryDealGetDouble(dk, DEAL_SWAP), 2) + ","
      + "\"commission\":"  + DoubleToString(HistoryDealGetDouble(dk, DEAL_COMMISSION), 2) + ","
      + "\"account\":"     + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))
      + "}";
   Post(ENDPOINT + "/mt-trade", j);
   Log("Cerrada posId=" + IntegerToString(posId)
       + " profit=" + DoubleToString(HistoryDealGetDouble(dk, DEAL_PROFIT), 2));
}

void CheckClosedTrades() {
   HistorySelect(TimeCurrent() - 86400, TimeCurrent());
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--) {
      ulong dk = HistoryDealGetTicket(i);
      if(!dk) continue;
      if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(dk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;
      if(Sent(dk)) continue;
      datetime closeT = (datetime)HistoryDealGetInteger(dk, DEAL_TIME);
      if(closeT > ultimaCierre) {
         ultimaCierre = closeT;
         GlobalVariableSet(GV_LAST_CLOSE, (double)ultimaCierre);
      }
      SendClosed(dk);
      MarkSent(dk);
   }
}

//+------------------------------------------------------------------+
//| SCORE CONDUCTUAL                                                 |
//+------------------------------------------------------------------+
void SyncScore() {
   string j = "{"
      + "\"account\":"         + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ","
      + "\"score\":"           + DoubleToString(scoreActual, 1) + ","
      + "\"perfil\":\""        + GetPerfil() + "\","
      + "\"disciplina\":"      + IntegerToString(GetIndiceDisciplina()) + ","
      + "\"violaciones_hoy\":" + IntegerToString(violacionesHoy) + ","
      + "\"balance\":"         + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
      + "\"equity\":"          + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ","
      + "\"pnl_dia\":"         + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY) - balanceInicio, 2)
      + "}";
   string respScore = Post(ENDPOINT + "/mt-score", j);
   AplicarRiskConfig(respScore);
}

void ActualizarConductual() {
   Comment("TradyncApp | Score: "  + DoubleToString(scoreActual, 0)
           + " | " + GetPerfil()
           + " | Disciplina: "     + IntegerToString(GetIndiceDisciplina()) + "/100"
           + " | Violaciones: "    + IntegerToString(violacionesHoy));
   static datetime ultimoSyncScore = 0;
   if(TimeCurrent() - ultimoSyncScore > 60) {
      SyncScore();
      ultimoSyncScore = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| GESTOR DE RIESGO                                                 |
//+------------------------------------------------------------------+
void CheckMaxOps() {
   if(MaxOperacionesDiarias <= 0) return;
   int total = PositionsTotal();
   if(!total) return;
   MqlDateTime dtH;
   TimeToStruct(TimeCurrent(), dtH);
   for(int i = total - 1; i >= 0; i--) {
      ulong tk = PositionGetTicket(i);
      if(!PositionSelectByTicket(tk)) continue;
      datetime openT = (datetime)PositionGetInteger(POSITION_TIME);
      MqlDateTime dtO;
      TimeToStruct(openT, dtO);
      if(dtO.year != dtH.year || dtO.mon != dtH.mon || dtO.day != dtH.day) continue;
      bool valida = false;
      for(int jj = 0; jj < ArraySize(ticketsValidosHoy); jj++)
         if(ticketsValidosHoy[jj] == tk) { valida = true; break; }
      if(valida) continue;
      if(contadorValidosHoy < MaxOperacionesDiarias) {
         if(ActivarAnalisisConductual) CheckImpulsividad(openT);
         int sz = ArraySize(ticketsValidosHoy);
         ArrayResize(ticketsValidosHoy, sz + 1);
         ticketsValidosHoy[sz] = tk;
         contadorValidosHoy++;
      } else {
         if(ActivarAnalisisConductual) {
            AnadirScore(2, "EXCESO_OPS");
            if(limitePerdidaAlcanzado) AnadirScore(3, "OPERATIVA_TRAS_PERDIDA");
         }
         CerrarPosicion(tk, "Excede limite diario");
      }
   }
}

void GestorRiesgo() {
   double pnl = AccountInfoDouble(ACCOUNT_EQUITY) - balanceInicio;
   if(LimitePerdidaDiaria > 0 && !limitePerdidaAlcanzado && pnl <= -MathAbs(LimitePerdidaDiaria)) {
      limitePerdidaAlcanzado = true;
      Log("Limite perdida alcanzado.");
      CerrarTodas("Limite perdida diaria");
      return;
   }
   if(LimiteGananciaDiaria > 0 && !limiteGananciaAlcanzado && pnl >= MathAbs(LimiteGananciaDiaria)) {
      limiteGananciaAlcanzado = true;
      Log("Limite ganancia alcanzado.");
      CerrarTodas("Limite ganancia diaria");
      return;
   }
   if(HoraInicio > 0 || HoraFin > 0) {
      MqlDateTime dtN;
      TimeToStruct(TimeCurrent(), dtN);
      bool fuera = (HoraInicio < HoraFin)
         ? (dtN.hour < HoraInicio || dtN.hour >= HoraFin)
         : (dtN.hour < HoraInicio && dtN.hour >= HoraFin);
      if(fuera) {
         for(int i = PositionsTotal() - 1; i >= 0; i--) {
            ulong tk = PositionGetTicket(i);
            if(!PositionSelectByTicket(tk)) continue;
            if(ActivarAnalisisConductual) AnadirScore(1, "FUERA_HORARIO");
            CerrarPosicion(tk, "Fuera de horario");
         }
      }
   }
   CheckMaxOps();
}

//+------------------------------------------------------------------+
//| EVENTOS PRINCIPALES                                              |
//+------------------------------------------------------------------+
int OnInit() {
   if(StringLen(TOKEN) < 10 || TOKEN == "PEGA_TU_TOKEN_AQUI") {
      Alert("Token no valido. Descarga el EA desde TradyncApp > Gestor EA.");
      return INIT_FAILED;
   }

   // Inicializar vars runtime desde inputs
   MaxOperacionesDiarias = MaxOps_Inicial;
   LimiteGananciaDiaria  = LimGanancia_Inicial;
   LimitePerdidaDiaria   = LimPerdida_Inicial;
   HoraInicio            = HoraInicio_Inicial;
   HoraFin               = HoraFin_Inicial;

   if(SensibilidadSistema == "low")       multScore = 0.5;
   else if(SensibilidadSistema == "high") multScore = 2.0;
   else                                   multScore = 1.0;

   InicializarConductual();
   InicializarDia();
   Log("TradyncSync v6.02 iniciado. Cuenta: "
       + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)));
   Log("Score: " + DoubleToString(scoreActual, 1)
       + " | " + GetPerfil()
       + " | Disciplina: " + IntegerToString(GetIndiceDisciplina()) + "/100");

   RegisterAccount();   // registra + aplica config de Tradyncapp
   SyncPositions(true);
   EventSetTimer(SyncInterval);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   EventKillTimer();
   GlobalVariableSet(GV_SCORE, scoreActual);
}

void OnTimer() {
   VerificarCambioDia();
   SyncPositions(false);
   CheckClosedTrades();
   if(EnableRiskManager)         GestorRiesgo();
   if(ActivarAnalisisConductual) ActualizarConductual();
}

void OnTrade() {
   Sleep(500);
   VerificarCambioDia();
   SyncPositions(false);
   CheckClosedTrades();
   if(EnableRiskManager)         GestorRiesgo();
   if(ActivarAnalisisConductual) ActualizarConductual();
}
//+------------------------------------------------------------------+
`;

// This function validates its own token (ea_token), not Supabase JWT
// We still accept the Authorization header to avoid the "missing header" error

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-auth-token",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url      = new URL(req.url);
  const platform = (url.searchParams.get("platform") ?? "mt5").toLowerCase();
  const token    = url.searchParams.get("token") ?? req.headers.get("x-auth-token") ?? "";

  if (!token) {
    return new Response(JSON.stringify({ error: "Token requerido" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Validate token against api_keys table
  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("token", token)
    .limit(1);

  if (error || !keys || keys.length === 0) {
    return new Response(JSON.stringify({ error: "Token invalido o inactivo" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Inject real token into EA code
  const eaContent = MT5_TEMPLATE.replace("%%TOKEN%%", token);
  const ext       = platform === "mt4" ? "mq4" : "mq5";
  const filename  = `TradyncSync_${platform.toUpperCase()}.${ext}`;

  // MT5 requires Windows CRLF line endings
  const eaContentCRLF = eaContent.split("\n").join("\r\n");

  return new Response(eaContentCRLF, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type":        "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
});
