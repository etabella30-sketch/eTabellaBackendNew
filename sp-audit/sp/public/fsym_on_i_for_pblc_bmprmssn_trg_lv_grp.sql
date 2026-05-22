CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_bmprmssn_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'BMPermission',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      281,                                                                                                                                             
                                      
          case when new."nBMPid" is null then '' else '"' || replace(replace(cast(new."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundleid" is null then '' else '"' || replace(replace(cast(new."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTRid" is null then '' else '"' || replace(replace(cast(new."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBMPid" is null then '' else '"' || cast(cast(new."ZnBMPid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundleid" is null then '' else '"' || cast(cast(new."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTRid" is null then '' else '"' || cast(cast(new."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_bmpermission',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
