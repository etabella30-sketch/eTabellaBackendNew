CREATE OR REPLACE FUNCTION present.fsym_on_d_for_prsnt_pmcntct_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'PMContact',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      293,                                                                                                                                             
                                      
          case when old."nPCid" is null then '' else '"' || replace(replace(cast(old."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nPCid" is null then '' else '"' || replace(replace(cast(old."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dDelDt" is null then '' when isfinite(old."dDelDt") then '"' || to_char(old."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nContactid" is null then '' else '"' || replace(replace(cast(old."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCreateid" is null then '' else '"' || replace(replace(cast(old."nCreateid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnContactid" is null then '' else '"' || cast(cast(old."ZnContactid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateid" is null then '' else '"' || cast(cast(old."ZnCreateid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPCid" is null then '' else '"' || cast(cast(old."ZnPCid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'present_pmcontact',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
