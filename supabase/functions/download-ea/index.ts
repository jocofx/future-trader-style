// Supabase Edge Function — Download EA (MQ5/MQ4)
// GET /functions/v1/download-ea?platform=mt5&token=xxx

const MT5_TEMPLATE = `//+------------------------------------------------------------------+
//|                                           TradyncSync_MT5.mq5    |
//|          Journal + Gestor de Riesgo + Analisis Conductual        |
//|                                      https://tradyncapp.com       |
//+------------------------------------------------------------------+
#property copyright "TradyncApp.com"
#property link      "https://tradyncapp.com"
#property version   "6.00"
#property strict

//+------------------------------------------------------------------+
//| PARAMETROS — SINCRONIZACION                                       |
//+------------------------------------------------------------------+
input group "=== SINCRONIZACION ==="
input int    SyncInterval          = 3;    // Intervalo sync (seg)
input bool   EnableLogs            = true; // Activar logs

//+------------------------------------------------------------------+
//| PARAMETROS — GESTOR DE RIESGO                                     |
//+------------------------------------------------------------------+
input group "=== GESTOR DE RIESGO ==="
input bool   EnableRiskManager     = true; // Activar gestor de riesgo
input int    MaxOperacionesDiarias = 0;    // Max operaciones por dia (0=sin limite)
input double LimiteGananciaDiaria  = 0;    // Limite ganancia $ (0=sin limite)
input double LimitePerdidaDiaria   = 0;    // Limite perdida $ (0=sin limite)
input int    HoraInicio            = 0;    // Hora inicio permitida (0=sin limite)
input int    HoraFin               = 0;    // Hora fin permitida (0=sin limite)

//+------------------------------------------------------------------+
//| PARAMETROS — ANALISIS CONDUCTUAL                                  |
//+------------------------------------------------------------------+
input group "=== ANALISIS CONDUCTUAL ==="
input bool   ActivarAnalisisConductual = true;  // Activar analisis conductual
input string SensibilidadSistema       = "medium";
input bool   ActivarFeedback           = true;
input bool   ActivarModoRestrictivo    = false;
input int    LimiteBloqueoScore        = 30;
input int    DecadenciaPuntosDia       = 2;
input int    MinutosEntreOpsImpulsivo  = 5;

string TOKEN    = "%%TOKEN%%";
string ENDPOINT = "https://www.tradyncapp.com/api";

struct PosCache { ulong ticket; double sl; double tp; double vol; };
PosCache posCache[];
ulong    sentTickets[];

ulong  ticketsValidosHoy[];
int    contadorValidosHoy;
string diaActual;
double balanceInicio;
bool   limitePerdidaAlcanzado;
bool   limiteGananciaAlcanzado;

string GV_SCORE       = "TRADYNC_SCORE";
string GV_LAST_CLOSE  = "TRADYNC_LAST_CLOSE";
string GV_VIOLA_DIA   = "TRADYNC_VIOLA_HOY";
string GV_LAST_DECAY  = "TRADYNC_LAST_DECAY";
string GV_REINTENTOS  = "TRADYNC_REINTENTOS";
string GV_LAST_BLOCK  = "TRADYNC_LAST_BLOCK";

double scoreActual;
int    violacionesHoy;
datetime ultimaCierre;
int    reintentosBloqueo;
double multScore;

int OnInit() {
   if(StringLen(TOKEN) < 10) { Alert("Token no valido."); return INIT_FAILED; }
   if(SensibilidadSistema=="low") multScore=0.5;
   else if(SensibilidadSistema=="high") multScore=2.0;
   else multScore=1.0;
   InicializarConductual();
   InicializarDia();
   Log("TradyncSync v6 iniciado. Score: "+DoubleToString(scoreActual,1)+" | "+GetPerfil());
   RegisterAccount();
   SyncPositions(true);
   EventSetTimer(SyncInterval);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); GlobalVariableSet(GV_SCORE,scoreActual); }

void OnTimer() {
   VerificarCambioDia(); SyncPositions(false); CheckClosedTrades();
   if(EnableRiskManager) GestorRiesgo();
   if(ActivarAnalisisConductual) ActualizarConductual();
}

void OnTrade() {
   Sleep(500); VerificarCambioDia(); SyncPositions(false); CheckClosedTrades();
   if(EnableRiskManager) GestorRiesgo();
   if(ActivarAnalisisConductual) ActualizarConductual();
}

void InicializarConductual() {
   scoreActual = GlobalVariableCheck(GV_SCORE) ? GlobalVariableGet(GV_SCORE) : 0;
   ultimaCierre = GlobalVariableCheck(GV_LAST_CLOSE) ? (datetime)GlobalVariableGet(GV_LAST_CLOSE) : 0;
   violacionesHoy=0; reintentosBloqueo=0;
   AplicarDecaimiento();
}

void AplicarDecaimiento() {
   if(DecadenciaPuntosDia<=0) return;
   datetime ahora=TimeCurrent(), ultimoDecay=0;
   if(GlobalVariableCheck(GV_LAST_DECAY)) ultimoDecay=(datetime)GlobalVariableGet(GV_LAST_DECAY);
   if(ultimoDecay>0) {
      MqlDateTime dt1,dt2; TimeToStruct(ultimoDecay,dt1); TimeToStruct(ahora,dt2);
      int dias=dt2.day_of_year-dt1.day_of_year;
      if(dt2.year>dt1.year) dias+=365;
      if(dias>0) {
         scoreActual=MathMax(0,scoreActual-(dias*DecadenciaPuntosDia));
         GlobalVariableSet(GV_SCORE,scoreActual);
         GlobalVariableSet(GV_LAST_DECAY,(double)ahora);
      }
   } else GlobalVariableSet(GV_LAST_DECAY,(double)ahora);
}

void AnadirScore(double pts, string ev) {
   double p=pts*multScore; scoreActual+=p; if(scoreActual<0) scoreActual=0;
   violacionesHoy++; GlobalVariableSet(GV_SCORE,scoreActual);
   Log("CONDUCTUAL ["+ev+"] +"+DoubleToString(p,1)+" | Score: "+DoubleToString(scoreActual,1));
   Feedback(ev,0);
}

void ActualizarConductual() {
   Comment("TradyncApp | Score: "+DoubleToString(scoreActual,0)+" | "+GetPerfil()+" | Disciplina: "+IntegerToString(GetIndiceDisciplina())+"/100");
   static datetime lastSync=0;
   if(TimeCurrent()-lastSync>60) { SyncScore(); lastSync=TimeCurrent(); }
}

void SyncScore() {
   string j="{\"account\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))
            +",\"score\":"+DoubleToString(scoreActual,1)
            +",\"perfil\":\""+GetPerfil()+"\""
            +",\"disciplina\":"+IntegerToString(GetIndiceDisciplina())
            +",\"violaciones_hoy\":"+IntegerToString(violacionesHoy)
            +",\"balance\":"+DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),2)
            +",\"equity\":"+DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY),2)
            +",\"pnl_dia\":"+DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY)-balanceInicio,2)+"}";
   Post(ENDPOINT+"/mt-score",j);
}

void CheckImpulsividad(datetime openTime) {
   if(ultimaCierre==0||MinutosEntreOpsImpulsivo<=0) return;
   int seg=(int)(openTime-ultimaCierre);
   if(seg>0&&seg<MinutosEntreOpsImpulsivo*60) AnadirScore(1,"IMPULSIVIDAD");
}

string GetPerfil() {
   if(scoreActual<=5) return "Disciplinado";
   if(scoreActual<=10) return "Levemente impulsivo";
   if(scoreActual<=20) return "Indisciplinado";
   if(scoreActual<=35) return "Alto riesgo";
   return "Trading compulsivo";
}

int GetIndiceDisciplina() { int i=100-(int)scoreActual; return MathMax(0,MathMin(100,i)); }

void Feedback(string ev, int extra) {
   if(!ActivarFeedback) return;
   string msg="";
   if(ev=="EXCESO_OPS") msg="⚠️ Has superado el limite diario. Score: "+DoubleToString(scoreActual,0);
   else if(ev=="OPERATIVA_TRAS_PERDIDA") msg="🚨 Posible revenge trading. Toma un descanso.";
   else if(ev=="OVERTRADING") msg="📊 Sobreoperacion detectada.";
   else if(ev=="IMPULSIVIDAD") msg="📉 Operacion impulsiva. Menos de "+IntegerToString(MinutosEntreOpsImpulsivo)+" min entre ops.";
   else if(ev=="FUERA_HORARIO") msg="🕐 Operacion fuera del horario permitido.";
   else if(ev=="BLOQUEO_ACTIVO") msg="🔒 Modo restrictivo. Score "+DoubleToString(scoreActual,0)+" >= "+IntegerToString(LimiteBloqueoScore);
   else if(ev=="DIA_CORRECTO"&&extra>=1) msg="✅ "+IntegerToString(extra)+" dia(s) correctos. Disciplina: "+IntegerToString(GetIndiceDisciplina())+"/100";
   if(msg!="") Print("TradyncSync FEEDBACK: "+msg);
}

void InicializarDia() {
   MqlDateTime dt; TimeToStruct(TimeCurrent(),dt);
   diaActual=StringFormat("%04d.%02d.%02d",dt.year,dt.mon,dt.day);
   balanceInicio=AccountInfoDouble(ACCOUNT_BALANCE);
   limitePerdidaAlcanzado=false; limiteGananciaAlcanzado=false;
   ArrayResize(ticketsValidosHoy,0); contadorValidosHoy=0; violacionesHoy=0;
}

void VerificarCambioDia() {
   MqlDateTime dt; TimeToStruct(TimeCurrent(),dt);
   string hoy=StringFormat("%04d.%02d.%02d",dt.year,dt.mon,dt.day);
   if(hoy!=diaActual) { AplicarDecaimiento(); InicializarDia(); }
}

void GestorRiesgo() {
   double pnl=AccountInfoDouble(ACCOUNT_EQUITY)-balanceInicio;
   if(LimitePerdidaDiaria>0&&!limitePerdidaAlcanzado&&pnl<=-MathAbs(LimitePerdidaDiaria)) {
      limitePerdidaAlcanzado=true; CerrarTodas("Limite perdida diaria"); return;
   }
   if(LimiteGananciaDiaria>0&&!limiteGananciaAlcanzado&&pnl>=MathAbs(LimiteGananciaDiaria)) {
      limiteGananciaAlcanzado=true; CerrarTodas("Limite ganancia diaria"); return;
   }
   CheckMaxOps();
}

void CheckMaxOps() {
   if(MaxOperacionesDiarias<=0) return;
   int total=PositionsTotal(); if(!total) return;
   MqlDateTime dtH; TimeToStruct(TimeCurrent(),dtH);
   for(int i=total-1;i>=0;i--) {
      ulong tk=PositionGetTicket(i); if(!PositionSelectByTicket(tk)) continue;
      datetime openT=(datetime)PositionGetInteger(POSITION_TIME);
      MqlDateTime dtO; TimeToStruct(openT,dtO);
      if(dtO.year!=dtH.year||dtO.mon!=dtH.mon||dtO.day!=dtH.day) continue;
      bool valida=false;
      for(int j=0;j<ArraySize(ticketsValidosHoy);j++) if(ticketsValidosHoy[j]==tk){valida=true;break;}
      if(valida) continue;
      if(contadorValidosHoy<MaxOperacionesDiarias) {
         if(ActivarAnalisisConductual) CheckImpulsividad(openT);
         int sz=ArraySize(ticketsValidosHoy); ArrayResize(ticketsValidosHoy,sz+1);
         ticketsValidosHoy[sz]=tk; contadorValidosHoy++;
      } else {
         if(ActivarAnalisisConductual) AnadirScore(2,"EXCESO_OPS");
         CerrarPosicion(tk,"Excede limite diario");
      }
   }
}

bool CerrarPosicion(ulong tk, string motivo) {
   if(!PositionSelectByTicket(tk)) return false;
   MqlTradeRequest rq; MqlTradeResult rs; ZeroMemory(rq); ZeroMemory(rs);
   rq.action=TRADE_ACTION_DEAL; rq.position=tk;
   rq.symbol=PositionGetString(POSITION_SYMBOL);
   rq.volume=PositionGetDouble(POSITION_VOLUME);
   rq.type=PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY?ORDER_TYPE_SELL:ORDER_TYPE_BUY;
   rq.price=rq.type==ORDER_TYPE_SELL?SymbolInfoDouble(rq.symbol,SYMBOL_BID):SymbolInfoDouble(rq.symbol,SYMBOL_ASK);
   rq.deviation=30; rq.comment="TradyncApp: "+motivo;
   return OrderSend(rq,rs);
}

void CerrarTodas(string m) { for(int i=PositionsTotal()-1;i>=0;i--){ulong tk=PositionGetTicket(i);if(tk>0)CerrarPosicion(tk,m);} }

void RegisterAccount() {
   string tipo=(ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE)==ACCOUNT_TRADE_MODE_DEMO?"demo":"real";
   string j="{\"account_number\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))
            +",\"broker\":\""+EscJ(AccountInfoString(ACCOUNT_COMPANY))+"\""
            +",\"server\":\""+EscJ(AccountInfoString(ACCOUNT_SERVER))+"\""
            +",\"currency\":\""+EscJ(AccountInfoString(ACCOUNT_CURRENCY))+"\""
            +",\"leverage\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE))
            +",\"balance\":"+DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),2)
            +",\"platform\":\"MT5\",\"account_type\":\""+tipo+"\""
            +",\"score\":"+DoubleToString(scoreActual,1)
            +",\"perfil\":\""+GetPerfil()+"\""+"}";
   Post(ENDPOINT+"/mt-register",j);
}

void SyncPositions(bool force) {
   int total=PositionsTotal(); PosCache current[]; ArrayResize(current,total);
   for(int i=0;i<total;i++) {
      ulong tk=PositionGetTicket(i); if(!tk||!PositionSelectByTicket(tk)) continue;
      current[i].ticket=tk; current[i].sl=PositionGetDouble(POSITION_SL);
      current[i].tp=PositionGetDouble(POSITION_TP); current[i].vol=PositionGetDouble(POSITION_VOLUME);
      if(force||Changed(tk,current[i])) SendPos(tk);
   }
   ArrayCopy(posCache,current);
}

void SendPos(ulong tk) {
   if(!PositionSelectByTicket(tk)) return;
   string tipo=PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY?"BUY":"SELL";
   string j="{\"ticket\":"+IntegerToString(tk)
            +",\"symbol\":\""+EscJ(PositionGetString(POSITION_SYMBOL))+"\""
            +",\"type\":\""+tipo+"\""
            +",\"volume\":"+DoubleToString(PositionGetDouble(POSITION_VOLUME),2)
            +",\"open_price\":"+DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN),5)
            +",\"sl\":"+DoubleToString(PositionGetDouble(POSITION_SL),5)
            +",\"tp\":"+DoubleToString(PositionGetDouble(POSITION_TP),5)
            +",\"open_time\":\""+FmtDT((datetime)PositionGetInteger(POSITION_TIME))+"\""
            +",\"profit\":"+DoubleToString(PositionGetDouble(POSITION_PROFIT),2)
            +",\"swap\":"+DoubleToString(PositionGetDouble(POSITION_SWAP),2)
            +",\"account\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))+"}";
   string resp=Post(ENDPOINT+"/mt-sync",j);
   if(StringFind(resp,"close_all")>=0) CerrarTodas("Solicitud servidor");
}

void CheckClosedTrades() {
   HistorySelect(TimeCurrent()-86400,TimeCurrent());
   for(int i=HistoryDealsTotal()-1;i>=0;i--) {
      ulong dk=HistoryDealGetTicket(i); if(!dk) continue;
      if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(dk,DEAL_ENTRY)!=DEAL_ENTRY_OUT) continue;
      if(Sent(dk)) continue;
      datetime ct=(datetime)HistoryDealGetInteger(dk,DEAL_TIME);
      if(ct>ultimaCierre){ultimaCierre=ct;GlobalVariableSet(GV_LAST_CLOSE,(double)ultimaCierre);}
      SendClosed(dk); MarkSent(dk);
   }
}

void SendClosed(ulong dk) {
   ulong posId=HistoryDealGetInteger(dk,DEAL_POSITION_ID);
   double openPx=0; datetime openT=0; string tipo="BUY";
   HistorySelectByPosition(posId);
   for(int j=0;j<HistoryDealsTotal();j++) {
      ulong d=HistoryDealGetTicket(j);
      if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(d,DEAL_ENTRY)==DEAL_ENTRY_IN) {
         openPx=HistoryDealGetDouble(d,DEAL_PRICE);
         openT=(datetime)HistoryDealGetInteger(d,DEAL_TIME);
         tipo=HistoryDealGetInteger(d,DEAL_TYPE)==DEAL_TYPE_BUY?"BUY":"SELL"; break;
      }
   }
   string j="{\"ticket\":"+IntegerToString(posId)
            +",\"symbol\":\""+EscJ(HistoryDealGetString(dk,DEAL_SYMBOL))+"\""
            +",\"type\":\""+tipo+"\""
            +",\"volume\":"+DoubleToString(HistoryDealGetDouble(dk,DEAL_VOLUME),2)
            +",\"open_price\":"+DoubleToString(openPx,5)
            +",\"close_price\":"+DoubleToString(HistoryDealGetDouble(dk,DEAL_PRICE),5)
            +",\"open_time\":\""+FmtDT(openT)+"\""
            +",\"close_time\":\""+FmtDT((datetime)HistoryDealGetInteger(dk,DEAL_TIME))+"\""
            +",\"profit\":"+DoubleToString(HistoryDealGetDouble(dk,DEAL_PROFIT),2)
            +",\"swap\":"+DoubleToString(HistoryDealGetDouble(dk,DEAL_SWAP),2)
            +",\"commission\":"+DoubleToString(HistoryDealGetDouble(dk,DEAL_COMMISSION),2)
            +",\"account\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))+"}";
   Post(ENDPOINT+"/mt-trade",j);
}

string Post(string url,string body) {
   string h="Content-Type: application/json\r\nX-Auth-Token: "+TOKEN+"\r\nAccept: application/json\r\n";
   uchar post[],result[]; string rh;
   StringToCharArray(body,post,0,WHOLE_ARRAY,CP_UTF8);
   int sz=ArraySize(post); if(sz>0&&post[sz-1]==0) ArrayResize(post,sz-1);
   int res=WebRequest("POST",url,h,5000,post,result,rh);
   if(res==-1){Log("HTTP ERR "+IntegerToString(GetLastError())); return "";}
   return CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
}

bool Changed(ulong tk,PosCache &p){for(int i=0;i<ArraySize(posCache);i++)if(posCache[i].ticket==tk)return MathAbs(posCache[i].sl-p.sl)>0.00001||MathAbs(posCache[i].tp-p.tp)>0.00001||MathAbs(posCache[i].vol-p.vol)>0.00001;return true;}
bool Sent(ulong tk){for(int i=0;i<ArraySize(sentTickets);i++)if(sentTickets[i]==tk)return true;return false;}
void MarkSent(ulong tk){int s=ArraySize(sentTickets);ArrayResize(sentTickets,s+1);sentTickets[s]=tk;}
string FmtDT(datetime dt){MqlDateTime m;TimeToStruct(dt,m);return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",m.year,m.mon,m.day,m.hour,m.min,m.sec);}
string EscJ(string s){StringReplace(s,"\\","\\\\");StringReplace(s,"\"","\\\"");StringReplace(s,"\n","\\n");return s;}
void Log(string msg){if(EnableLogs)Print("TradyncSync: "+msg);}`;

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

  return new Response(eaContent, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type":        "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
});
