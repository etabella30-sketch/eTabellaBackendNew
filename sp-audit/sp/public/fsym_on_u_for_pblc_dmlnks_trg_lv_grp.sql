CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_dmlnks_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nDMLids" is null then '' else '"' || replace(replace(cast(new."nDMLids" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jHighlights" is null then '' else '"' || replace(replace(cast(new."jHighlights" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jLinktype" is null then '' else '"' || replace(replace(cast(new."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOTexts" is null then '' else '"' || replace(replace(cast(new."jOTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDocid" is null then '' else '"' || replace(replace(cast(new."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDMLids" is null then '' else '"' || cast(cast(new."ZnDMLids" as numeric) as varchar) || '"' end||','||
          case when new."ZnDocid" is null then '' else '"' || cast(cast(new."ZnDocid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nDMLids" is null then '' else '"' || replace(replace(cast(old."nDMLids" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jHighlights" is null then '' else '"' || replace(replace(cast(old."jHighlights" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jLinktype" is null then '' else '"' || replace(replace(cast(old."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOTexts" is null then '' else '"' || replace(replace(cast(old."jOTexts" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDocid" is null then '' else '"' || replace(replace(cast(old."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDMLids" is null then '' else '"' || cast(cast(old."ZnDMLids" as numeric) as varchar) || '"' end||','||
          case when old."ZnDocid" is null then '' else '"' || cast(cast(old."ZnDocid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'DMLinks',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      263,                                                                                                                                             
                                      
          case when old."nDMLids" is null then '' else '"' || replace(replace(cast(old."nDMLids" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_dmlinks',                                                                                                                                                
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
