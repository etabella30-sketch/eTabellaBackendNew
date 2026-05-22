CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rssdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RIssueDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      260,                                                                                                                                             
                                      
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
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_rissuedetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
