CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_dmlnks_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'DMLinks',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      263,                                                                                                                                             
                                      
          case when new."nDMLids" is null then '' else '"' || replace(replace(cast(new."nDMLids" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jHighlights" is null then '' else '"' || replace(replace(cast(new."jHighlights" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jLinktype" is null then '' else '"' || replace(replace(cast(new."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOTexts" is null then '' else '"' || replace(replace(cast(new."jOTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDocid" is null then '' else '"' || replace(replace(cast(new."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDMLids" is null then '' else '"' || cast(cast(new."ZnDMLids" as numeric) as varchar) || '"' end||','||
          case when new."ZnDocid" is null then '' else '"' || cast(cast(new."ZnDocid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_dmlinks',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
