CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_tgmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nTagid" is null then '' else '"' || replace(replace(cast(new."nTagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTag" is null then '' else '"' || replace(replace(cast(new."cTag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cClr" is null then '' else '"' || replace(replace(cast(new."cClr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDesc" is null then '' else '"' || replace(replace(cast(new."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nOTagid" is null then '' else '"' || cast(cast(new."nOTagid" as numeric) as varchar) || '"' end||','||
          case when new."nOParentTagid" is null then '' else '"' || cast(cast(new."nOParentTagid" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nParenttagid" is null then '' else '"' || replace(replace(cast(new."nParenttagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnParenttagid" is null then '' else '"' || cast(cast(new."ZnParenttagid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTagid" is null then '' else '"' || cast(cast(new."ZnTagid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nTagid" is null then '' else '"' || replace(replace(cast(old."nTagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTag" is null then '' else '"' || replace(replace(cast(old."cTag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cClr" is null then '' else '"' || replace(replace(cast(old."cClr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDesc" is null then '' else '"' || replace(replace(cast(old."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nOTagid" is null then '' else '"' || cast(cast(old."nOTagid" as numeric) as varchar) || '"' end||','||
          case when old."nOParentTagid" is null then '' else '"' || cast(cast(old."nOParentTagid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nParenttagid" is null then '' else '"' || replace(replace(cast(old."nParenttagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnParenttagid" is null then '' else '"' || cast(cast(old."ZnParenttagid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTagid" is null then '' else '"' || cast(cast(old."ZnTagid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'TagMaster',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      238,                                                                                                                                             
                                      
          case when old."nTagid" is null then '' else '"' || replace(replace(cast(old."nTagid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_tagmaster',                                                                                                                                                
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
