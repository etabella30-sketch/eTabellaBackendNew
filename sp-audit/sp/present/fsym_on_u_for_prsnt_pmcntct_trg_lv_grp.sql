CREATE OR REPLACE FUNCTION present.fsym_on_u_for_prsnt_pmcntct_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nPCid" is null then '' else '"' || replace(replace(cast(new."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dDelDt" is null then '' when isfinite(new."dDelDt") then '"' || to_char(new."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nContactid" is null then '' else '"' || replace(replace(cast(new."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCreateid" is null then '' else '"' || replace(replace(cast(new."nCreateid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnContactid" is null then '' else '"' || cast(cast(new."ZnContactid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCreateid" is null then '' else '"' || cast(cast(new."ZnCreateid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPCid" is null then '' else '"' || cast(cast(new."ZnPCid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nPCid" is null then '' else '"' || replace(replace(cast(old."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dDelDt" is null then '' when isfinite(old."dDelDt") then '"' || to_char(old."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nContactid" is null then '' else '"' || replace(replace(cast(old."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCreateid" is null then '' else '"' || replace(replace(cast(old."nCreateid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnContactid" is null then '' else '"' || cast(cast(old."ZnContactid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateid" is null then '' else '"' || cast(cast(old."ZnCreateid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPCid" is null then '' else '"' || cast(cast(old."ZnPCid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'PMContact',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      293,                                                                                                                                             
                                      
          case when old."nPCid" is null then '' else '"' || replace(replace(cast(old."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'present_pmcontact',                                                                                                                                                
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
