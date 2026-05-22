CREATE OR REPLACE FUNCTION helpcenter.fsym_on_u_for_hlpcntr_srchkywrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nKeyid" is null then '' else '"' || replace(replace(cast(new."nKeyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cKey" is null then '' else '"' || replace(replace(cast(new."cKey" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCount" is null then '' else '"' || cast(cast(new."nCount" as numeric) as varchar) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."ZnKeyid" is null then '' else '"' || cast(cast(new."ZnKeyid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nKeyid" is null then '' else '"' || replace(replace(cast(old."nKeyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cKey" is null then '' else '"' || replace(replace(cast(old."cKey" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCount" is null then '' else '"' || cast(cast(old."nCount" as numeric) as varchar) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."ZnKeyid" is null then '' else '"' || cast(cast(old."ZnKeyid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'SearchKeyWord',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      236,                                                                                                                                             
                                      
          case when old."nKeyid" is null then '' else '"' || replace(replace(cast(old."nKeyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'helpcenter_searchkeyword',                                                                                                                                                
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
