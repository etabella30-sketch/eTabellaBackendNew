CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_bmprmssn_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nBMPid" is null then '' else '"' || replace(replace(cast(new."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundleid" is null then '' else '"' || replace(replace(cast(new."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTRid" is null then '' else '"' || replace(replace(cast(new."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBMPid" is null then '' else '"' || cast(cast(new."ZnBMPid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundleid" is null then '' else '"' || cast(cast(new."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTRid" is null then '' else '"' || cast(cast(new."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nBMPid" is null then '' else '"' || replace(replace(cast(old."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundleid" is null then '' else '"' || replace(replace(cast(old."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTRid" is null then '' else '"' || replace(replace(cast(old."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBMPid" is null then '' else '"' || cast(cast(old."ZnBMPid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundleid" is null then '' else '"' || cast(cast(old."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTRid" is null then '' else '"' || cast(cast(old."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'BMPermission',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      281,                                                                                                                                             
                                      
          case when old."nBMPid" is null then '' else '"' || replace(replace(cast(old."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_bmpermission',                                                                                                                                                
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
