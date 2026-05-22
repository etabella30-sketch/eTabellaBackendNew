CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_tskdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'TaskDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      248,                                                                                                                                             
                                      
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
          case when new."dEndDt" is null then '' when isfinite(new."dEndDt") then '"' || to_char(new."dEndDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
                                      'public_taskdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
