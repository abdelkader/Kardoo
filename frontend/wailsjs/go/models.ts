export namespace main {
	
	export class AppConfig {
	    windowX: number;
	    windowY: number;
	    windowWidth: number;
	    windowHeight: number;
	    backupOnSave: boolean;
	    backupDir: string;
	    language: string;
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.windowX = source["windowX"];
	        this.windowY = source["windowY"];
	        this.windowWidth = source["windowWidth"];
	        this.windowHeight = source["windowHeight"];
	        this.backupOnSave = source["backupOnSave"];
	        this.backupDir = source["backupDir"];
	        this.language = source["language"];
	    }
	}

}

