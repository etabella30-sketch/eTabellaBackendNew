CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_bdttrbts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nBDAid" is null then '' else '"' || replace(replace(cast(new."nBDAid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPageposition" is null then '' else '"' || replace(replace(cast(new."cPageposition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nStartfrom" is null then '' else '"' || cast(cast(new."nStartfrom" as numeric) as varchar) || '"' end||','||
          case when new."jPagination" is null then '' else '"' || replace(replace(cast(new."jPagination" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDescription" is null then '' else '"' || replace(replace(cast(new."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cIsPaginate" is null then '' when new."cIsPaginate" then '"1"' else '"0"' end||','||
          case when new."pagerotation" is null then '' else '"' || replace(replace(cast(new."pagerotation" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRotate" is null then '' else '"' || cast(cast(new."nRotate" as numeric) as varchar) || '"' end||','||
          case when new."bIsconvert" is null then '' else '"' || replace(replace(cast(new."bIsconvert" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFVer" is null then '' else '"' || replace(replace(cast(new."cFVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLVer" is null then '' else '"' || replace(replace(cast(new."cLVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nEStatus" is null then '' else '"' || cast(cast(new."nEStatus" as numeric) as varchar) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nConvertid" is null then '' else '"' || replace(replace(cast(new."nConvertid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPtaskid" is null then '' else '"' || replace(replace(cast(new."nPtaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBDAid" is null then '' else '"' || cast(cast(new."ZnBDAid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnConvertid" is null then '' else '"' || cast(cast(new."ZnConvertid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPtaskid" is null then '' else '"' || cast(cast(new."ZnPtaskid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nBDAid" is null then '' else '"' || replace(replace(cast(old."nBDAid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPageposition" is null then '' else '"' || replace(replace(cast(old."cPageposition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nStartfrom" is null then '' else '"' || cast(cast(old."nStartfrom" as numeric) as varchar) || '"' end||','||
          case when old."jPagination" is null then '' else '"' || replace(replace(cast(old."jPagination" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDescription" is null then '' else '"' || replace(replace(cast(old."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIsPaginate" is null then '' when old."cIsPaginate" then '"1"' else '"0"' end||','||
          case when old."pagerotation" is null then '' else '"' || replace(replace(cast(old."pagerotation" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRotate" is null then '' else '"' || cast(cast(old."nRotate" as numeric) as varchar) || '"' end||','||
          case when old."bIsconvert" is null then '' else '"' || replace(replace(cast(old."bIsconvert" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFVer" is null then '' else '"' || replace(replace(cast(old."cFVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLVer" is null then '' else '"' || replace(replace(cast(old."cLVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nEStatus" is null then '' else '"' || cast(cast(old."nEStatus" as numeric) as varchar) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nConvertid" is null then '' else '"' || replace(replace(cast(old."nConvertid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPtaskid" is null then '' else '"' || replace(replace(cast(old."nPtaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDAid" is null then '' else '"' || cast(cast(old."ZnBDAid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnConvertid" is null then '' else '"' || cast(cast(old."ZnConvertid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPtaskid" is null then '' else '"' || cast(cast(old."ZnPtaskid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'BDAttributes',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      233,                                                                                                                                             
                                      
          case when old."nBDAid" is null then '' else '"' || replace(replace(cast(old."nBDAid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_bdattributes',                                                                                                                                                
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
