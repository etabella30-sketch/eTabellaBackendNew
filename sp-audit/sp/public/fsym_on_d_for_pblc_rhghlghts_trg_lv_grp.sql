CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rhghlghts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RHighlights',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      274,                                                                                                                                             
                                      
          case when old."nHid" is null then '' else '"' || replace(replace(cast(old."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nHid" is null then '' else '"' || replace(replace(cast(old."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cNote" is null then '' else '"' || replace(replace(cast(old."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jCordinates" is null then '' else '"' || replace(replace(cast(old."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreatedt" is null then '' when isfinite(old."dCreatedt") then '"' || to_char(old."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cPageno" is null then '' else '"' || replace(replace(cast(old."cPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLineno" is null then '' else '"' || replace(replace(cast(old."cLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTPageno" is null then '' else '"' || replace(replace(cast(old."cTPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTLineno" is null then '' else '"' || replace(replace(cast(old."cTLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTime" is null then '' else '"' || replace(replace(cast(old."cTime" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTTime" is null then '' else '"' || replace(replace(cast(old."cTTime" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."oP" is null then '' else '"' || cast(cast(old."oP" as numeric) as varchar) || '"' end||','||
          case when old."oL" is null then '' else '"' || cast(cast(old."oL" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLID" is null then '' else '"' || replace(replace(cast(old."nLID" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSessionId" is null then '' else '"' || replace(replace(cast(old."nSessionId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnHid" is null then '' else '"' || cast(cast(old."ZnHid" as numeric) as varchar) || '"' end||','||
          case when old."ZnLID" is null then '' else '"' || cast(cast(old."ZnLID" as numeric) as varchar) || '"' end||','||
          case when old."ZnSessionId" is null then '' else '"' || cast(cast(old."ZnSessionId" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."identity" is null then '' else '"' || replace(replace(cast(old."identity" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cOPageno" is null then '' else '"' || replace(replace(cast(old."cOPageno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cOLineno" is null then '' else '"' || replace(replace(cast(old."cOLineno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRefHid" is null then '' else '"' || replace(replace(cast(old."nRefHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."timeDiffernce" is null then '' when old."timeDiffernce" then '"1"' else '"0"' end||','||
          case when old."tidentity" is null then '' else '"' || replace(replace(cast(old."tidentity" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTCordinates" is null then '' else '"' || replace(replace(cast(old."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTransferStatus" is null then '' else '"' || replace(replace(cast(old."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
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
