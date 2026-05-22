CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_fmshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'FMShared',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      225,                                                                                                                                             
                                      
          case when new."nFMSdid" is null then '' else '"' || replace(replace(cast(new."nFMSdid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFSid" is null then '' else '"' || replace(replace(cast(new."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnFMSdid" is null then '' else '"' || cast(cast(new."ZnFMSdid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSid" is null then '' else '"' || cast(cast(new."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."bCanComment" is null then '' when new."bCanComment" then '"1"' else '"0"' end||','||
          case when new."bCanCopy" is null then '' when new."bCanCopy" then '"1"' else '"0"' end||','||
          case when new."bCanEdit" is null then '' when new."bCanEdit" then '"1"' else '"0"' end||','||
          case when new."bCanReshare" is null then '' when new."bCanReshare" then '"1"' else '"0"' end||','||
          case when new."nShareBy" is null then '' else '"' || replace(replace(cast(new."nShareBy" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_fmshared',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
