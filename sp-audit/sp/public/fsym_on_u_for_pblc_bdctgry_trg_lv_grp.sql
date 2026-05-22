CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_bdctgry_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nBDACid" is null then '' else '"' || replace(replace(cast(new."nBDACid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cAttr" is null then '' else '"' || replace(replace(cast(new."cAttr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBDACid" is null then '' else '"' || cast(cast(new."ZnBDACid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nBDACid" is null then '' else '"' || replace(replace(cast(old."nBDACid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cAttr" is null then '' else '"' || replace(replace(cast(old."cAttr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDACid" is null then '' else '"' || cast(cast(old."ZnBDACid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'BDACategory',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      249,                                                                                                                                             
                                      
          case when old."nBDACid" is null then '' else '"' || replace(replace(cast(old."nBDACid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_bdacategory',                                                                                                                                                
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
