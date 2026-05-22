CREATE OR REPLACE FUNCTION helpcenter.fsym_on_d_for_hlpcntr_fqfdbck_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'FaqFeedback',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      280,                                                                                                                                             
                                      
          case when old."nFFid" is null then '' else '"' || replace(replace(cast(old."nFFid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nFFid" is null then '' else '"' || replace(replace(cast(old."nFFid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."bIsHelpful" is null then '' when old."bIsHelpful" then '"1"' else '"0"' end||','||
          case when old."nFaqid" is null then '' else '"' || replace(replace(cast(old."nFaqid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnFFid" is null then '' else '"' || cast(cast(old."ZnFFid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFaqid" is null then '' else '"' || cast(cast(old."ZnFaqid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'helpcenter_faqfeedback',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
