from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import secrets
import hashlib

class LicenseKey(BaseModel):
    key: str
    duration: str  # '1day', '1week', '1month', '1year'
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    expiresAt: datetime
    isActive: bool = True
    activatedAt: Optional[datetime] = None
    hardwareId: Optional[str] = None

class LicenseGenerator:
    """Generate and validate license keys"""
    
    DURATIONS = {
        '1day': timedelta(days=1),
        '1week': timedelta(weeks=1),
        '1month': timedelta(days=30),
        '1year': timedelta(days=365)
    }
    
    @staticmethod
    def generate_key(duration: str) -> str:
        """Generate a license key"""
        if duration not in LicenseGenerator.DURATIONS:
            raise ValueError(f"Invalid duration. Must be one of: {list(LicenseGenerator.DURATIONS.keys())}")
        
        # Generate random bytes
        random_bytes = secrets.token_bytes(16)
        
        # Create key format: DPPXXX-XXXXX-XXXXX-XXXXX
        key_data = random_bytes.hex().upper()
        formatted_key = f"DPP{duration[0].upper()}{duration[-1].upper()}-{key_data[0:5]}-{key_data[5:10]}-{key_data[10:15]}-{key_data[15:20]}"
        
        return formatted_key
    
    @staticmethod
    def create_license(duration: str) -> LicenseKey:
        """Create a new license"""
        key = LicenseGenerator.generate_key(duration)
        expires_at = datetime.utcnow() + LicenseGenerator.DURATIONS[duration]
        
        return LicenseKey(
            key=key,
            duration=duration,
            expiresAt=expires_at
        )
    
    @staticmethod
    def validate_key(key: str, hardware_id: str = None) -> bool:
        """Validate a license key"""
        # This is a simplified validation
        # In production, you'd check against a database
        return key.startswith('DPP') and len(key.split('-')) == 5
    
    @staticmethod
    def get_hardware_id() -> str:
        """Generate hardware ID for license binding"""
        # Simple hardware fingerprint
        import platform
        import uuid
        
        machine_id = str(uuid.getnode())
        platform_info = platform.platform()
        
        fingerprint = f"{machine_id}-{platform_info}"
        return hashlib.sha256(fingerprint.encode()).hexdigest()[:16]
