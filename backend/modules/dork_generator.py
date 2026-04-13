from typing import List, Dict

class DorkGenerator:
    """Generate Google Dorks for security testing"""
    
    DORK_TEMPLATES = {
        'admin': [
            'site:{target} inurl:admin',
            'site:{target} intitle:"admin panel"',
            'site:{target} inurl:"admin/login"',
            'site:{target} inurl:wp-admin',
            'site:{target} inurl:administrator',
            'site:{target} intitle:"Admin Login"',
            'site:{target} inurl:"admin/index"',
            'site:{target} inurl:"admin.php"'
        ],
        'files': [
            'site:{target} filetype:pdf',
            'site:{target} filetype:sql',
            'site:{target} filetype:env',
            'site:{target} ext:log',
            'site:{target} filetype:bak',
            'site:{target} filetype:config',
            'site:{target} filetype:xml',
            'site:{target} ext:sql intext:password',
            'site:{target} filetype:csv',
            'site:{target} ext:txt intext:password'
        ],
        'login': [
            'site:{target} inurl:login.php',
            'site:{target} intitle:"Login"',
            'site:{target} inurl:signin',
            'site:{target} inurl:auth',
            'site:{target} inurl:"user/login"',
            'site:{target} intitle:"Member Login"',
            'site:{target} inurl:"login.asp"',
            'site:{target} inurl:"secure/login"'
        ],
        'database': [
            'site:{target} filetype:sql intext:password',
            'site:{target} inurl:"phpMyAdmin"',
            'site:{target} intext:"sql dump"',
            'site:{target} ext:sql',
            'site:{target} inurl:"database"',
            'site:{target} filetype:mdb',
            'site:{target} intext:"MySQL dump"',
            'site:{target} ext:sql intext:"INSERT INTO"'
        ],
        'sensitive': [
            'site:{target} intext:"confidential"',
            'site:{target} filetype:xls intext:"password"',
            'site:{target} intext:"credit card"',
            'site:{target} intext:"SSN"',
            'site:{target} filetype:doc intext:"confidential"',
            'site:{target} intext:"internal use only"',
            'site:{target} inurl:"backup"',
            'site:{target} ext:bak intext:database'
        ],
        'config': [
            'site:{target} ext:php intext:"DB_PASSWORD"',
            'site:{target} filetype:env intext:"DB_PASSWORD"',
            'site:{target} inurl:"config.php"',
            'site:{target} ext:conf',
            'site:{target} filetype:ini',
            'site:{target} inurl:"configuration.php"',
            'site:{target} ext:yml intext:"password"',
            'site:{target} filetype:json intext:"password"'
        ]
    }
    
    @staticmethod
    def generate(target: str, dork_type: str) -> List[str]:
        """Generate dorks for a target domain"""
        templates = DorkGenerator.DORK_TEMPLATES.get(dork_type, [])
        return [template.format(target=target) for template in templates]
    
    @staticmethod
    def get_all_types() -> List[str]:
        """Get all available dork types"""
        return list(DorkGenerator.DORK_TEMPLATES.keys())
    
    @staticmethod
    def generate_advanced(target: str, keywords: List[str]) -> List[str]:
        """Generate advanced dorks with custom keywords"""
        dorks = []
        for keyword in keywords:
            dorks.extend([
                f'site:{target} intext:"{keyword}"',
                f'site:{target} inurl:"{keyword}"',
                f'site:{target} intitle:"{keyword}"',
            ])
        return dorks
