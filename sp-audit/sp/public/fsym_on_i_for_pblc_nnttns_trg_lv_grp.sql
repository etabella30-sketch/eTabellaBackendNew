CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_nnttns_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'Annotations',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      275,                                                                                                                                             
                                      
          case when new."nAId" is null then '' else '"' || replace(replace(cast(new."nAId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."uuid" is null then '' else '"' || replace(replace(cast(new."uuid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."type" is null then '' else '"' || replace(replace(cast(new."type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."rects" is null then '' else '"' || replace(replace(cast(new."rects" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."lines" is null then '' else '"' || replace(replace(cast(new."lines" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."width" is null then '' else '"' || cast(cast(new."width" as numeric) as varchar) || '"' end||','||
          case when new."page" is null then '' else '"' || cast(cast(new."page" as numeric) as varchar) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."isHyperlink" is null then '' when new."isHyperlink" then '"1"' else '"0"' end||','||
          case when new."clr" is null then '' else '"' || replace(replace(cast(new."clr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPresentid" is null then '' else '"' || replace(replace(cast(new."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBDid" is null then '' else '"' || replace(replace(cast(new."nBDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDMLinkid" is null then '' else '"' || replace(replace(cast(new."nDMLinkid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDocid" is null then '' else '"' || replace(replace(cast(new."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFSid" is null then '' else '"' || replace(replace(cast(new."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFMLid" is null then '' else '"' || replace(replace(cast(new."nFMLid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nHLid" is null then '' else '"' || replace(replace(cast(new."nHLid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."colorid" is null then '' else '"' || replace(replace(cast(new."colorid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nWebid" is null then '' else '"' || replace(replace(cast(new."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."Zcolorid" is null then '' else '"' || cast(cast(new."Zcolorid" as numeric) as varchar) || '"' end||','||
          case when new."ZnAId" is null then '' else '"' || cast(cast(new."ZnAId" as numeric) as varchar) || '"' end||','||
          case when new."ZnBDid" is null then '' else '"' || cast(cast(new."ZnBDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDMLinkid" is null then '' else '"' || cast(cast(new."ZnDMLinkid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDocid" is null then '' else '"' || cast(cast(new."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFMLid" is null then '' else '"' || cast(cast(new."ZnFMLid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSid" is null then '' else '"' || cast(cast(new."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnHLid" is null then '' else '"' || cast(cast(new."ZnHLid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPresentid" is null then '' else '"' || cast(cast(new."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when new."ZnWebid" is null then '' else '"' || cast(cast(new."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_annotations',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
