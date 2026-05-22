CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_tskdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nTDid" is null then '' else '"' || replace(replace(cast(new."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cSubject" is null then '' else '"' || replace(replace(cast(new."cSubject" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDesc" is null then '' else '"' || replace(replace(cast(new."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jEmailnotify" is null then '' else '"' || replace(replace(cast(new."jEmailnotify" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nClaimid" is null then '' else '"' || cast(cast(new."nClaimid" as numeric) as varchar) || '"' end||','||
          case when new."nPriority" is null then '' else '"' || cast(cast(new."nPriority" as numeric) as varchar) || '"' end||','||
          case when new."nProgress" is null then '' else '"' || cast(cast(new."nProgress" as numeric) as varchar) || '"' end||','||
          case when new."jTimeline" is null then '' else '"' || replace(replace(cast(new."jTimeline" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nImpactid" is null then '' else '"' || cast(cast(new."nImpactid" as numeric) as varchar) || '"' end||','||
          case when new."nRelevanceid" is null then '' else '"' || cast(cast(new."nRelevanceid" as numeric) as varchar) || '"' end||','||
          case when new."cTasktype" is null then '' else '"' || replace(replace(cast(new."cTasktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nIssueid" is null then '' else '"' || replace(replace(cast(new."nIssueid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTaskid" is null then '' else '"' || replace(replace(cast(new."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnIssueid" is null then '' else '"' || cast(cast(new."ZnIssueid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTDid" is null then '' else '"' || cast(cast(new."ZnTDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTaskid" is null then '' else '"' || cast(cast(new."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when new."nStatus" is null then '' else '"' || cast(cast(new."nStatus" as numeric) as varchar) || '"' end||','||
          case when new."cAssign" is null then '' when new."cAssign" then '"1"' else '"0"' end||','||
          case when new."cRemind" is null then '' when new."cRemind" then '"1"' else '"0"' end||','||
          case when new."cStatusChange" is null then '' when new."cStatusChange" then '"1"' else '"0"' end||','||
          case when new."dStartDt" is null then '' when isfinite(new."dStartDt") then '"' || to_char(new."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dEndDt" is null then '' when isfinite(new."dEndDt") then '"' || to_char(new."dEndDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end; 
                                    var_old_data := 
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cSubject" is null then '' else '"' || replace(replace(cast(old."cSubject" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDesc" is null then '' else '"' || replace(replace(cast(old."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jEmailnotify" is null then '' else '"' || replace(replace(cast(old."jEmailnotify" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nClaimid" is null then '' else '"' || cast(cast(old."nClaimid" as numeric) as varchar) || '"' end||','||
          case when old."nPriority" is null then '' else '"' || cast(cast(old."nPriority" as numeric) as varchar) || '"' end||','||
          case when old."nProgress" is null then '' else '"' || cast(cast(old."nProgress" as numeric) as varchar) || '"' end||','||
          case when old."jTimeline" is null then '' else '"' || replace(replace(cast(old."jTimeline" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nImpactid" is null then '' else '"' || cast(cast(old."nImpactid" as numeric) as varchar) || '"' end||','||
          case when old."nRelevanceid" is null then '' else '"' || cast(cast(old."nRelevanceid" as numeric) as varchar) || '"' end||','||
          case when old."cTasktype" is null then '' else '"' || replace(replace(cast(old."cTasktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nIssueid" is null then '' else '"' || replace(replace(cast(old."nIssueid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTaskid" is null then '' else '"' || replace(replace(cast(old."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnIssueid" is null then '' else '"' || cast(cast(old."ZnIssueid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTDid" is null then '' else '"' || cast(cast(old."ZnTDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTaskid" is null then '' else '"' || cast(cast(old."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when old."nStatus" is null then '' else '"' || cast(cast(old."nStatus" as numeric) as varchar) || '"' end||','||
          case when old."cAssign" is null then '' when old."cAssign" then '"1"' else '"0"' end||','||
          case when old."cRemind" is null then '' when old."cRemind" then '"1"' else '"0"' end||','||
          case when old."cStatusChange" is null then '' when old."cStatusChange" then '"1"' else '"0"' end||','||
          case when old."dStartDt" is null then '' when isfinite(old."dStartDt") then '"' || to_char(old."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dEndDt" is null then '' when isfinite(old."dEndDt") then '"' || to_char(old."dEndDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'TaskDetail',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      248,                                                                                                                                             
                                      
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_taskdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
