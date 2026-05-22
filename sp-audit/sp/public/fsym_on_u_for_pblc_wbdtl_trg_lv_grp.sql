CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_wbdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
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
          case when new."ZnWebid" is null then '' else '"' || cast(cast(new."ZnWebid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nWDid" is null then '' else '"' || replace(replace(cast(old."nWDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cUrl" is null then '' else '"' || replace(replace(cast(old."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTitle" is null then '' else '"' || replace(replace(cast(old."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cNote" is null then '' else '"' || replace(replace(cast(old."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jHighlight" is null then '' else '"' || replace(replace(cast(old."jHighlight" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jLinktype" is null then '' else '"' || replace(replace(cast(old."jLinktype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cImg" is null then '' else '"' || replace(replace(cast(old."cImg" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFavicon" is null then '' else '"' || replace(replace(cast(old."cFavicon" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTooltype" is null then '' else '"' || replace(replace(cast(old."cTooltype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jOText" is null then '' else '"' || replace(replace(cast(old."jOText" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nWebid" is null then '' else '"' || replace(replace(cast(old."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnWDid" is null then '' else '"' || cast(cast(old."ZnWDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWebid" is null then '' else '"' || cast(cast(old."ZnWebid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'WebDetail',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      240,                                                                                                                                             
                                      
          case when old."nWDid" is null then '' else '"' || replace(replace(cast(old."nWDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_webdetail',                                                                                                                                                
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
