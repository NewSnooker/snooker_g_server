// src/plugins/swagger.plugin.ts
import swagger from "@elysiajs/swagger";

export const swaggerPlugin = () => {
  return swagger({
    provider: "scalar", //[scalar, swagger-ui]"
    documentation: {
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      info: {
        title: "Game_(Next_Elysia) API",
        version: "1.0.0",
        description: "API สำหรับ Game",
      },
      tags: [
        { name: "App", description: "General endpoints" },
        { name: "Admin", description: "Admin endpoints" },
        { name: "Auth", description: "Auth endpoints" },
        { name: "User", description: "User endpoints" },
      ],
    },
  });
};
