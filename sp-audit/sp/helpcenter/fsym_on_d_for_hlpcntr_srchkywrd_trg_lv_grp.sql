CREATE OR REPLACE FUNCTION helpcenter.fsym_on_d_for_hlpcntr_srchkywrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'SearchKeyWord',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      236,                                                                                                                                             
                                      
          case when old."nKeyid" is null then '' else '"' || replace(replace(cast(old."nKeyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nKeyid" is null then '' else '"' || replace(replace(cast(old."nKeyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cKey" is null then '' else '"' || replace(replace(cast(old."cKey" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCount" is null then '' else '"' || cast(cast(old."nCount" as numeric) as varchar) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."ZnKeyid" is null then '' else '"' || cast(cast(old."ZnKeyid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'helpcenter_searchkeyword',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
