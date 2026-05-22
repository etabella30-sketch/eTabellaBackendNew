CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_srmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'UserMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      232,                                                                                                                                             
                                      
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFname" is null then '' else '"' || replace(replace(cast(old."cFname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLname" is null then '' else '"' || replace(replace(cast(old."cLname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cEmail" is null then '' else '"' || replace(replace(cast(old."cEmail" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPassword" is null then '' else '"' || replace(replace(cast(old."cPassword" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."isAdmin" is null then '' when old."isAdmin" then '"1"' else '"0"' end||','||
          case when old."dLastlogindt" is null then '' when isfinite(old."dLastlogindt") then '"' || to_char(old."dLastlogindt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cToken" is null then '' else '"' || replace(replace(cast(old."cToken" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cProfile" is null then '' else '"' || replace(replace(cast(old."cProfile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cJwt" is null then '' else '"' || replace(replace(cast(old."cJwt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTZid" is null then '' else '"' || cast(cast(old."nTZid" as numeric) as varchar) || '"' end||','||
          case when old."nOUserid" is null then '' else '"' || cast(cast(old."nOUserid" as numeric) as varchar) || '"' end||','||
          case when old."dLastoutdt" is null then '' when isfinite(old."dLastoutdt") then '"' || to_char(old."dLastoutdt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dSyncdt" is null then '' when isfinite(old."dSyncdt") then '"' || to_char(old."dSyncdt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nCreateId" is null then '' else '"' || replace(replace(cast(old."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUpdateId" is null then '' else '"' || replace(replace(cast(old."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCreateId" is null then '' else '"' || cast(cast(old."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnUpdateId" is null then '' else '"' || cast(cast(old."ZnUpdateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_usermaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
