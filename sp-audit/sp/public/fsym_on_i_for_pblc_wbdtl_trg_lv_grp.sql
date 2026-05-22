CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_wbdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'WebDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      240,                                                                                                                                             
                                      
          case when new."nWDid" is null then '' else '"' || replace(replace(cast(new."nWDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cUrl" is null then '' else '"' || replace(replace(cast(new."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTitle" is null then '' else '"' || replace(replace(cast(new."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cNote" is null then '' else '"' || replace(replace(cast(new."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jHighlight" is null then '' else '"' || replace(replace(cast(new."jHighlight" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jLinktype" is null then '' else '"' || replace(replace(cast(new."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cImg" is null then '' else '"' || replace(replace(cast(new."cImg" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFavicon" is null then '' else '"' || replace(replace(cast(new."cFavicon" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTooltype" is null then '' else '"' || replace(replace(cast(new."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jOText" is null then '' else '"' || replace(replace(cast(new."jOText" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nWebid" is null then '' else '"' || replace(replace(cast(new."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnWDid" is null then '' else '"' || cast(cast(new."ZnWDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnWebid" is null then '' else '"' || cast(cast(new."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_webdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
