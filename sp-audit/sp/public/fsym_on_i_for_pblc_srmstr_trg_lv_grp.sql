CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_srmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'UserMaster',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      232,                                                                                                                                             
                                      
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFname" is null then '' else '"' || replace(replace(cast(new."cFname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLname" is null then '' else '"' || replace(replace(cast(new."cLname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cEmail" is null then '' else '"' || replace(replace(cast(new."cEmail" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPassword" is null then '' else '"' || replace(replace(cast(new."cPassword" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."isAdmin" is null then '' when new."isAdmin" then '"1"' else '"0"' end||','||
          case when new."dLastlogindt" is null then '' when isfinite(new."dLastlogindt") then '"' || to_char(new."dLastlogindt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cToken" is null then '' else '"' || replace(replace(cast(new."cToken" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cProfile" is null then '' else '"' || replace(replace(cast(new."cProfile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cJwt" is null then '' else '"' || replace(replace(cast(new."cJwt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTZid" is null then '' else '"' || cast(cast(new."nTZid" as numeric) as varchar) || '"' end||','||
          case when new."nOUserid" is null then '' else '"' || cast(cast(new."nOUserid" as numeric) as varchar) || '"' end||','||
          case when new."dLastoutdt" is null then '' when isfinite(new."dLastoutdt") then '"' || to_char(new."dLastoutdt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dSyncdt" is null then '' when isfinite(new."dSyncdt") then '"' || to_char(new."dSyncdt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nCreateId" is null then '' else '"' || replace(replace(cast(new."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUpdateId" is null then '' else '"' || replace(replace(cast(new."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCreateId" is null then '' else '"' || cast(cast(new."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when new."ZnUpdateId" is null then '' else '"' || cast(cast(new."ZnUpdateId" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
