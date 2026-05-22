CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rsssndtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RSessionDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      235,                                                                                                                                             
                                      
          case when new."nSDid" is null then '' else '"' || replace(replace(cast(new."nSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cUsertype" is null then '' else '"' || replace(replace(cast(new."cUsertype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dDelDt" is null then '' when isfinite(new."dDelDt") then '"' || to_char(new."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cDefHIssues" is null then '' else '"' || replace(replace(cast(new."cDefHIssues" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDefIssues" is null then '' else '"' || replace(replace(cast(new."cDefIssues" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLID" is null then '' else '"' || replace(replace(cast(new."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLIid" is null then '' else '"' || replace(replace(cast(new."nLIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSesid" is null then '' else '"' || replace(replace(cast(new."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnLID" is null then '' else '"' || cast(cast(new."ZnLID" as numeric) as varchar) || '"' end||','||
          case when new."ZnLIid" is null then '' else '"' || cast(cast(new."ZnLIid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSDid" is null then '' else '"' || cast(cast(new."ZnSDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSesid" is null then '' else '"' || cast(cast(new."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_rsessiondetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
