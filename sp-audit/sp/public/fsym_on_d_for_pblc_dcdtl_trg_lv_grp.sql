CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_dcdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'DocDetail',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      257,                                                                                                                                             
                                      
          case when old."nDMDid" is null then '' else '"' || replace(replace(cast(old."nDMDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nDMDid" is null then '' else '"' || replace(replace(cast(old."nDMDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jHighlight" is null then '' else '"' || replace(replace(cast(old."jHighlight" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jLinktype" is null then '' else '"' || replace(replace(cast(old."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTooltype" is null then '' else '"' || replace(replace(cast(old."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOText" is null then '' else '"' || replace(replace(cast(old."jOText" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDocid" is null then '' else '"' || replace(replace(cast(old."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRefdocid" is null then '' else '"' || replace(replace(cast(old."nRefdocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnDMDid" is null then '' else '"' || cast(cast(old."ZnDMDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDocid" is null then '' else '"' || cast(cast(old."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRefdocid" is null then '' else '"' || cast(cast(old."ZnRefdocid" as numeric) as varchar) || '"' end||','||
          case when old."jCordinates" is null then '' else '"' || replace(replace(cast(old."jCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOCordinates" is null then '' else '"' || replace(replace(cast(old."jOCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTCordinates" is null then '' else '"' || replace(replace(cast(old."jTCordinates" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jTexts" is null then '' else '"' || replace(replace(cast(old."jTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLine" is null then '' else '"' || cast(cast(old."nLine" as numeric) as varchar) || '"' end||','||
          case when old."nPage" is null then '' else '"' || cast(cast(old."nPage" as numeric) as varchar) || '"' end||','||
          case when old."nTLine" is null then '' else '"' || cast(cast(old."nTLine" as numeric) as varchar) || '"' end||','||
          case when old."nTPage" is null then '' else '"' || cast(cast(old."nTPage" as numeric) as varchar) || '"' end||','||
          case when old."cTransferStatus" is null then '' else '"' || replace(replace(cast(old."cTransferStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
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
