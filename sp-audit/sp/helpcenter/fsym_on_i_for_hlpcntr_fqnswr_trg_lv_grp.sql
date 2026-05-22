CREATE OR REPLACE FUNCTION helpcenter.fsym_on_i_for_hlpcntr_fqnswr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'FaqAnswer',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      267,                                                                                                                                             
                                      
          case when new."nFaid" is null then '' else '"' || replace(replace(cast(new."nFaid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cAnswer" is null then '' else '"' || replace(replace(cast(new."cAnswer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nFaqid" is null then '' else '"' || replace(replace(cast(new."nFaqid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnFaid" is null then '' else '"' || cast(cast(new."ZnFaid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFaqid" is null then '' else '"' || cast(cast(new."ZnFaqid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'helpcenter_faqanswer',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
