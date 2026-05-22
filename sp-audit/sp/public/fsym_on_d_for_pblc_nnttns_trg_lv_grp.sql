CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_nnttns_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'Annotations',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      275,                                                                                                                                             
                                      
          case when old."nAId" is null then '' else '"' || replace(replace(cast(old."nAId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nAId" is null then '' else '"' || replace(replace(cast(old."nAId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."uuid" is null then '' else '"' || replace(replace(cast(old."uuid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."type" is null then '' else '"' || replace(replace(cast(old."type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."rects" is null then '' else '"' || replace(replace(cast(old."rects" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."lines" is null then '' else '"' || replace(replace(cast(old."lines" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."width" is null then '' else '"' || cast(cast(old."width" as numeric) as varchar) || '"' end||','||
          case when old."page" is null then '' else '"' || cast(cast(old."page" as numeric) as varchar) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."isHyperlink" is null then '' when old."isHyperlink" then '"1"' else '"0"' end||','||
          case when old."clr" is null then '' else '"' || replace(replace(cast(old."clr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPresentid" is null then '' else '"' || replace(replace(cast(old."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBDid" is null then '' else '"' || replace(replace(cast(old."nBDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDMLinkid" is null then '' else '"' || replace(replace(cast(old."nDMLinkid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDocid" is null then '' else '"' || replace(replace(cast(old."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFMLid" is null then '' else '"' || replace(replace(cast(old."nFMLid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nHLid" is null then '' else '"' || replace(replace(cast(old."nHLid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."colorid" is null then '' else '"' || replace(replace(cast(old."colorid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nWebid" is null then '' else '"' || replace(replace(cast(old."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."Zcolorid" is null then '' else '"' || cast(cast(old."Zcolorid" as numeric) as varchar) || '"' end||','||
          case when old."ZnAId" is null then '' else '"' || cast(cast(old."ZnAId" as numeric) as varchar) || '"' end||','||
          case when old."ZnBDid" is null then '' else '"' || cast(cast(old."ZnBDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDMLinkid" is null then '' else '"' || cast(cast(old."ZnDMLinkid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDocid" is null then '' else '"' || cast(cast(old."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFMLid" is null then '' else '"' || cast(cast(old."ZnFMLid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnHLid" is null then '' else '"' || cast(cast(old."ZnHLid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPresentid" is null then '' else '"' || cast(cast(old."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWebid" is null then '' else '"' || cast(cast(old."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                   
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
