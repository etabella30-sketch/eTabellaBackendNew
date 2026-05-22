CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_fmshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'FMShared',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      225,                                                                                                                                             
                                      
          case when old."nFMSdid" is null then '' else '"' || replace(replace(cast(old."nFMSdid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nFMSdid" is null then '' else '"' || replace(replace(cast(old."nFMSdid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnFMSdid" is null then '' else '"' || cast(cast(old."ZnFMSdid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."bCanComment" is null then '' when old."bCanComment" then '"1"' else '"0"' end||','||
          case when old."bCanCopy" is null then '' when old."bCanCopy" then '"1"' else '"0"' end||','||
          case when old."bCanEdit" is null then '' when old."bCanEdit" then '"1"' else '"0"' end||','||
          case when old."bCanReshare" is null then '' when old."bCanReshare" then '"1"' else '"0"' end||','||
          case when old."nShareBy" is null then '' else '"' || replace(replace(cast(old."nShareBy" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
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
