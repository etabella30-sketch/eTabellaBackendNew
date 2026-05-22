CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rsssntrnscrpts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nSTid" is null then '' else '"' || replace(replace(cast(new."nSTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dUploadDt" is null then '' when isfinite(new."dUploadDt") then '"' || to_char(new."dUploadDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nSesid" is null then '' else '"' || replace(replace(cast(new."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnSTid" is null then '' else '"' || cast(cast(new."ZnSTid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSesid" is null then '' else '"' || cast(cast(new."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nSTid" is null then '' else '"' || replace(replace(cast(old."nSTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dUploadDt" is null then '' when isfinite(old."dUploadDt") then '"' || to_char(old."dUploadDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nSesid" is null then '' else '"' || replace(replace(cast(old."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnSTid" is null then '' else '"' || cast(cast(old."ZnSTid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSesid" is null then '' else '"' || cast(cast(old."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RSessionTranscripts',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      239,                                                                                                                                             
                                      
          case when old."nSTid" is null then '' else '"' || replace(replace(cast(old."nSTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rsessiontranscripts',                                                                                                                                                
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
