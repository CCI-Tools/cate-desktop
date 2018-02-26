

This is how update works:

    function update(required_version):

        if exist("~/.cate/$required_version/cate.location") and exists($("~/.cate/$required_version/cate.location")): 
            -> done
            
        find latest $version in ~/.cate/$version if exists("~/.cate/$version/cate.location") exists and exists($("~/.cate/$version/cate.location")):
        
        if $version found:
            if version == required_version:
                -> done
            if version < required_version:
                -> update_cate(required_version)  # moves ~/.cate/$version --> ~/.cate/$required_version
        else:
            -> install_cate(required_version)
    
    function update_cate(required_version):
        exec("activate
        exec("conda update")
        
        
    function install_cate(required_version)
        # options            

        # 1. install new private (~/.cate/<version>/python) # noEnv
        # 2. install new env into existing conda (prompt path, existing env)  # withEnv           
        # 3. use & update existing cate (prompt path, existing env)  # withEnv           

        download_miniconda()
        install_miniconda()
        install_cate_env()
