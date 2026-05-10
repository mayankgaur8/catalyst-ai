import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions";
import * as Sentry from "@sentry/nextjs";

let registered = false;
let sdk: NodeSDK | null = null;

export async function registerObservability() {
  if (registered) return;
  registered = true;

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
      environment: process.env.NODE_ENV,
      enabled: true,
    });
  }

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [SEMRESATTRS_SERVICE_NAME]: "catalyst-ai",
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? "development",
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : undefined,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    await sdk.start();
  }
}

export async function shutdownObservability() {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
