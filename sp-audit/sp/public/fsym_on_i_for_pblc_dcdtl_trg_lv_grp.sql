CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_dcdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'DocDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      257,                                                                                                                                             
                                      
          case when new."nDMDid" is null then '' else '"' || replace(replace(cast(new."nDMDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jHighlight" is null then '' else '"' || replace(replace(cast(new."jHighlight" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jLinktype" is null then '' else '"' || replace(replace(cast(new."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTooltype" is null then '' else '"' || replace(replace(cast(new."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOText" is null then '' else '"' || replace(replace(cast(new."jOText" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDocid" is null then '' else '"' || replace(replace(cast(new."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRefdocid" is null then '' else '"' || replace(replace(cast(new."nRefdocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnDMDid" is null then '' else '"' || cast(cast(new."ZnDMDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDocid" is null then '' else '"' || cast(cast(new."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRefdocid" is null then '' else '"' || cast(cast(new."ZnRefdocid" as numeric) as varchar) || '"' end||','||
          case when new."jCordinates" is null then '' else '"' || replace(replace(cast(new."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOCordinates" is null then '' else '"' || replace(replace(cast(new."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTCordinates" is null then '' else '"' || replace(replace(cast(new."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jTexts" is null then '' else '"' || replace(replace(cast(new."jTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLine" is null then '' else '"' || cast(cast(new."nLine" as numeric) as varchar) || '"' end||','||
          case when new."nPage" is null then '' else '"' || cast(cast(new."nPage" as numeric) as varchar) || '"' end||','||
          case when new."nTLine" is null then '' else '"' || cast(cast(new."nTLine" as numeric) as varchar) || '"' end||','||
          case when new."nTPage" is null then '' else '"' || cast(cast(new."nTPage" as numeric) as varchar) || '"' end||','||
          case when new."cTransferStatus" is null then '' else '"' || replace(replace(cast(new."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_docdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
