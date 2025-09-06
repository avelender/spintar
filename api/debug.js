// Debug endpoint для диагностики OAuth2 токенов и API
export default async function handler(req, res) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).end();
    }
    try {
        console.log('🔧 [DEBUG] Starting debug endpoint');
        
        // Получаем cookies
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};
        
        const accessToken = cookies.access_token;
        const refreshToken = cookies.refresh_token;
        
        console.log('🔧 [DEBUG] Available cookies:', Object.keys(cookies));
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            cookies: {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                accessTokenLength: accessToken?.length,
                refreshTokenLength: refreshToken?.length,
                accessTokenStart: accessToken?.substring(0, 20) + '...',
                allCookieKeys: Object.keys(cookies)
            },
            environment: {
                CLIENT_ID: process.env.CLIENT_ID?.substring(0, 8) + '...',
                CLIENT_SECRET: !!process.env.CLIENT_SECRET,
                REDIRECT_URI: process.env.REDIRECT_URI
            },
            jwt: null,
            apiTest: null,
            callbackTest: null
        };
        
        // Декодируем JWT если есть
        if (accessToken) {
            try {
                const tokenParts = accessToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    debugInfo.jwt = {
                        header: JSON.parse(Buffer.from(tokenParts[0], 'base64').toString()),
                        payload: payload,
                        hasSignature: !!tokenParts[2]
                    };
                }
            } catch (error) {
                debugInfo.jwt = { error: error.message };
            }
        }
        
        // Тестируем API орбитара
        if (accessToken) {
            try {
                console.log('🔧 [DEBUG] Testing Orbitar API...');
                
                // Пробуем разные endpoints
                const endpoints = [
                    { name: 'user/profile (empty)', url: '/api/v1/user/profile', body: {} },
                    { name: 'user/profile (with username)', url: '/api/v1/user/profile', body: { username: debugInfo.jwt?.payload?.username || 'test' } }
                ];
                
                debugInfo.apiTest = {};
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await fetch(`https://api.orbitar.space${endpoint.url}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(endpoint.body)
                        });
                        
                        let responseData;
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && contentType.includes('application/json')) {
                            responseData = await response.json();
                        } else {
                            responseData = await response.text();
                        }
                        
                        debugInfo.apiTest[endpoint.name] = {
                            status: response.status,
                            headers: Object.fromEntries(response.headers.entries()),
                            data: responseData
                        };
                        
                    } catch (error) {
                        debugInfo.apiTest[endpoint.name] = {
                            error: error.message
                        };
                    }
                }
                
            } catch (error) {
                debugInfo.apiTest = { error: error.message };
            }
        }
        
        // Тестируем callback endpoint
        try {
            const callbackResponse = await fetch(`https://spintar.vercel.app/api/auth/callback?test=true`);
            debugInfo.callbackTest = {
                status: callbackResponse.status,
                statusText: callbackResponse.statusText,
                accessible: callbackResponse.ok
            };
        } catch (error) {
            debugInfo.callbackTest = {
                error: error.message,
                accessible: false
            };
        }
        
        console.log('🔧 [DEBUG] Debug info collected:', JSON.stringify(debugInfo, null, 2));
        
        res.status(200).json({
            success: true,
            debug: debugInfo
        });
        
    } catch (error) {
        console.error('🔧 [DEBUG] Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
