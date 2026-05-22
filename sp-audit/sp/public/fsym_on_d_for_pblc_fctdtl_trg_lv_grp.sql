CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_fctdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'FactDetail',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      253,                                                                                                                                             
                                      
          case when old."nFSDid" is null then '' else '"' || replace(replace(cast(old."nFSDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
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
          case when old."cTransferStatus" is null then '' else '"' || replace(replace(cast(old."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
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
