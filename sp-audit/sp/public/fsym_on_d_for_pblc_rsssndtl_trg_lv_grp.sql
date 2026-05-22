CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rsssndtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RSessionDetail',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      235,                                                                                                                                             
                                      
          case when old."nSDid" is null then '' else '"' || replace(replace(cast(old."nSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nSDid" is null then '' else '"' || replace(replace(cast(old."nSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cUsertype" is null then '' else '"' || replace(replace(cast(old."cUsertype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dDelDt" is null then '' when isfinite(old."dDelDt") then '"' || to_char(old."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cDefHIssues" is null then '' else '"' || replace(replace(cast(old."cDefHIssues" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDefIssues" is null then '' else '"' || replace(replace(cast(old."cDefIssues" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLID" is null then '' else '"' || replace(replace(cast(old."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLIid" is null then '' else '"' || replace(replace(cast(old."nLIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSesid" is null then '' else '"' || replace(replace(cast(old."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnLID" is null then '' else '"' || cast(cast(old."ZnLID" as numeric) as varchar) || '"' end||','||
          case when old."ZnLIid" is null then '' else '"' || cast(cast(old."ZnLIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSDid" is null then '' else '"' || cast(cast(old."ZnSDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSesid" is null then '' else '"' || cast(cast(old."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
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
