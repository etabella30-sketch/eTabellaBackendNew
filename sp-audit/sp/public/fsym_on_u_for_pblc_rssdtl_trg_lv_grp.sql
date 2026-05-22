CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rssdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nIDid" is null then '' else '"' || replace(replace(cast(new."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cNote" is null then '' else '"' || replace(replace(cast(new."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPageno" is null then '' else '"' || replace(replace(cast(new."cPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jCordinates" is null then '' else '"' || replace(replace(cast(new."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreatedt" is null then '' when isfinite(new."dCreatedt") then '"' || to_char(new."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdatedt" is null then '' when isfinite(new."dUpdatedt") then '"' || to_char(new."dUpdatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cONote" is null then '' else '"' || replace(replace(cast(new."cONote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTCordinates" is null then '' else '"' || replace(replace(cast(new."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTPageno" is null then '' else '"' || replace(replace(cast(new."cTPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jCordinates1" is null then '' else '"' || replace(replace(cast(new."jCordinates1" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."bTrf" is null then '' when new."bTrf" then '"1"' else '"0"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."cUNote" is null then '' else '"' || replace(replace(cast(new."cUNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLID" is null then '' else '"' || replace(replace(cast(new."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSessionid" is null then '' else '"' || replace(replace(cast(new."nSessionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnIDid" is null then '' else '"' || cast(cast(new."ZnIDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnLID" is null then '' else '"' || cast(cast(new."ZnLID" as numeric) as varchar) || '"' end||','||
          case when new."ZnSessionid" is null then '' else '"' || cast(cast(new."ZnSessionid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."jOCordinates" is null then '' else '"' || replace(replace(cast(new."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."isInActivated" is null then '' when new."isInActivated" then '"1"' else '"0"' end||','||
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := 
          case when old."nIDid" is null then '' else '"' || replace(replace(cast(old."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cNote" is null then '' else '"' || replace(replace(cast(old."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPageno" is null then '' else '"' || replace(replace(cast(old."cPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jCordinates" is null then '' else '"' || replace(replace(cast(old."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreatedt" is null then '' when isfinite(old."dCreatedt") then '"' || to_char(old."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdatedt" is null then '' when isfinite(old."dUpdatedt") then '"' || to_char(old."dUpdatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cONote" is null then '' else '"' || replace(replace(cast(old."cONote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTCordinates" is null then '' else '"' || replace(replace(cast(old."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTPageno" is null then '' else '"' || replace(replace(cast(old."cTPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jCordinates1" is null then '' else '"' || replace(replace(cast(old."jCordinates1" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."bTrf" is null then '' when old."bTrf" then '"1"' else '"0"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."cUNote" is null then '' else '"' || replace(replace(cast(old."cUNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLID" is null then '' else '"' || replace(replace(cast(old."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSessionid" is null then '' else '"' || replace(replace(cast(old."nSessionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIDid" is null then '' else '"' || cast(cast(old."ZnIDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnLID" is null then '' else '"' || cast(cast(old."ZnLID" as numeric) as varchar) || '"' end||','||
          case when old."ZnSessionid" is null then '' else '"' || cast(cast(old."ZnSessionid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."jOCordinates" is null then '' else '"' || replace(replace(cast(old."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."isInActivated" is null then '' when old."isInActivated" then '"1"' else '"0"' end||','||
          case when old."cTransferStatus" is null then '' else '"' || replace(replace(cast(old."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RIssueDetail',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      260,                                                                                                                                             
                                      
          case when old."nIDid" is null then '' else '"' || replace(replace(cast(old."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rissuedetail',                                                                                                                                                
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
