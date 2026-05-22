CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rhghlghts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RHighlights',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      274,                                                                                                                                             
                                      
          case when new."nHid" is null then '' else '"' || replace(replace(cast(new."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cNote" is null then '' else '"' || replace(replace(cast(new."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jCordinates" is null then '' else '"' || replace(replace(cast(new."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreatedt" is null then '' when isfinite(new."dCreatedt") then '"' || to_char(new."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cPageno" is null then '' else '"' || replace(replace(cast(new."cPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLineno" is null then '' else '"' || replace(replace(cast(new."cLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTPageno" is null then '' else '"' || replace(replace(cast(new."cTPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTLineno" is null then '' else '"' || replace(replace(cast(new."cTLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTime" is null then '' else '"' || replace(replace(cast(new."cTime" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTTime" is null then '' else '"' || replace(replace(cast(new."cTTime" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."oP" is null then '' else '"' || cast(cast(new."oP" as numeric) as varchar) || '"' end||','||
          case when new."oL" is null then '' else '"' || cast(cast(new."oL" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLID" is null then '' else '"' || replace(replace(cast(new."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSessionId" is null then '' else '"' || replace(replace(cast(new."nSessionId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnHid" is null then '' else '"' || cast(cast(new."ZnHid" as numeric) as varchar) || '"' end||','||
          case when new."ZnLID" is null then '' else '"' || cast(cast(new."ZnLID" as numeric) as varchar) || '"' end||','||
          case when new."ZnSessionId" is null then '' else '"' || cast(cast(new."ZnSessionId" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."identity" is null then '' else '"' || replace(replace(cast(new."identity" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cOPageno" is null then '' else '"' || replace(replace(cast(new."cOPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cOLineno" is null then '' else '"' || replace(replace(cast(new."cOLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRefHid" is null then '' else '"' || replace(replace(cast(new."nRefHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."timeDiffernce" is null then '' when new."timeDiffernce" then '"1"' else '"0"' end||','||
          case when new."tidentity" is null then '' else '"' || replace(replace(cast(new."tidentity" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTCordinates" is null then '' else '"' || replace(replace(cast(new."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_rhighlights',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
