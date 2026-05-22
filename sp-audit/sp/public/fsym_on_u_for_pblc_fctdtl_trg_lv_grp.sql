CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_fctdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nFSDid" is null then '' else '"' || replace(replace(cast(new."nFSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFact" is null then '' else '"' || replace(replace(cast(new."cFact" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTZid" is null then '' else '"' || cast(cast(new."nTZid" as numeric) as varchar) || '"' end||','||
          case when new."jDate" is null then '' else '"' || replace(replace(cast(new."jDate" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFiletype" is null then '' else '"' || cast(cast(new."nFiletype" as numeric) as varchar) || '"' end||','||
          case when new."nStatus" is null then '' else '"' || cast(cast(new."nStatus" as numeric) as varchar) || '"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jLinktype" is null then '' else '"' || replace(replace(cast(new."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTooltype" is null then '' else '"' || replace(replace(cast(new."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jFacts" is null then '' else '"' || replace(replace(cast(new."jFacts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTexts" is null then '' else '"' || replace(replace(cast(new."jTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOT" is null then '' else '"' || replace(replace(cast(new."jOT" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cIsNote" is null then '' else '"' || replace(replace(cast(new."cIsNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."bIsHighlighted" is null then '' when new."bIsHighlighted" then '"1"' else '"0"' end||','||
          case when new."nFSid" is null then '' else '"' || replace(replace(cast(new."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nColorid" is null then '' else '"' || replace(replace(cast(new."nColorid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnColorid" is null then '' else '"' || cast(cast(new."ZnColorid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSDid" is null then '' else '"' || cast(cast(new."ZnFSDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSid" is null then '' else '"' || cast(cast(new."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when new."end_date" is null then '' when isfinite(new."end_date") then '"' || to_char(new."end_date", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."jCordinates" is null then '' else '"' || replace(replace(cast(new."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOCordinates" is null then '' else '"' || replace(replace(cast(new."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTCordinates" is null then '' else '"' || replace(replace(cast(new."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLine" is null then '' else '"' || cast(cast(new."nLine" as numeric) as varchar) || '"' end||','||
          case when new."nPage" is null then '' else '"' || cast(cast(new."nPage" as numeric) as varchar) || '"' end||','||
          case when new."nTLine" is null then '' else '"' || cast(cast(new."nTLine" as numeric) as varchar) || '"' end||','||
          case when new."nTPage" is null then '' else '"' || cast(cast(new."nTPage" as numeric) as varchar) || '"' end||','||
          case when new."start_date" is null then '' when isfinite(new."start_date") then '"' || to_char(new."start_date", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := 
          case when old."nFSDid" is null then '' else '"' || replace(replace(cast(old."nFSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFact" is null then '' else '"' || replace(replace(cast(old."cFact" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTZid" is null then '' else '"' || cast(cast(old."nTZid" as numeric) as varchar) || '"' end||','||
          case when old."jDate" is null then '' else '"' || replace(replace(cast(old."jDate" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFiletype" is null then '' else '"' || cast(cast(old."nFiletype" as numeric) as varchar) || '"' end||','||
          case when old."nStatus" is null then '' else '"' || cast(cast(old."nStatus" as numeric) as varchar) || '"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jLinktype" is null then '' else '"' || replace(replace(cast(old."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTooltype" is null then '' else '"' || replace(replace(cast(old."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jFacts" is null then '' else '"' || replace(replace(cast(old."jFacts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTexts" is null then '' else '"' || replace(replace(cast(old."jTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOT" is null then '' else '"' || replace(replace(cast(old."jOT" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIsNote" is null then '' else '"' || replace(replace(cast(old."cIsNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."bIsHighlighted" is null then '' when old."bIsHighlighted" then '"1"' else '"0"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nColorid" is null then '' else '"' || replace(replace(cast(old."nColorid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnColorid" is null then '' else '"' || cast(cast(old."ZnColorid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSDid" is null then '' else '"' || cast(cast(old."ZnFSDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."end_date" is null then '' when isfinite(old."end_date") then '"' || to_char(old."end_date", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."jCordinates" is null then '' else '"' || replace(replace(cast(old."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOCordinates" is null then '' else '"' || replace(replace(cast(old."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTCordinates" is null then '' else '"' || replace(replace(cast(old."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLine" is null then '' else '"' || cast(cast(old."nLine" as numeric) as varchar) || '"' end||','||
          case when old."nPage" is null then '' else '"' || cast(cast(old."nPage" as numeric) as varchar) || '"' end||','||
          case when old."nTLine" is null then '' else '"' || cast(cast(old."nTLine" as numeric) as varchar) || '"' end||','||
          case when old."nTPage" is null then '' else '"' || cast(cast(old."nTPage" as numeric) as varchar) || '"' end||','||
          case when old."start_date" is null then '' when isfinite(old."start_date") then '"' || to_char(old."start_date", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cTransferStatus" is null then '' else '"' || replace(replace(cast(old."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'FactDetail',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      253,                                                                                                                                             
                                      
          case when old."nFSDid" is null then '' else '"' || replace(replace(cast(old."nFSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_factdetail',                                                                                                                                                
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
