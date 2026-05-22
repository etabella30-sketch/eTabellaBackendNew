CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_fctdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'FactDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      253,                                                                                                                                             
                                      
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
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_factdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
