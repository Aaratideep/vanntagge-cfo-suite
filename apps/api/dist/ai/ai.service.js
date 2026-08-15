"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const stream_1 = require("stream");
let AiService = class AiService {
    constructor() {
        this.nemoguardrailsUrl = 'http://localhost:8000/api/chat';
    }
    async handleChat(chatRequest, res) {
        try {
            const response = await fetch(this.nemoguardrailsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chatRequest),
            });
            if (!response.ok) {
                throw new Error(`NeMo service responded with status ${response.status}`);
            }
            res.setHeader('Content-Type', 'text/plain');
            const nodeStream = stream_1.Readable.fromWeb(response.body);
            nodeStream.pipe(res);
        }
        catch (error) {
            console.error('Error connecting to NeMo Guardrails service:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'AI Copilot service is currently unavailable.' });
            }
            else {
                res.end();
            }
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map