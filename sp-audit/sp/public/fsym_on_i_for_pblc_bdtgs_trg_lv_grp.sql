CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_bdtgs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'BDTags',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      247,                                                                                                                                             
                                      
          case when new."nBDTGid" is null then '' else '"' || replace(replace(cast(new."nBDTGid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTagid" is null then '' else '"' || replace(replace(cast(new."nTagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBDTGid" is null then '' else '"' || cast(cast(new."ZnBDTGid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTagid" is null then '' else '"' || cast(cast(new."ZnTagid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_bdtags',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
