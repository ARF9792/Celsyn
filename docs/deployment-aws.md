# Celsyn deployment on AWS and Vercel

The production demo uses a deliberately small footprint:

- Vercel serves the React application.
- CloudFront provides HTTPS and WebSocket support for the API.
- One Amazon Linux EC2 instance runs the API, simulator, and Nginx in Docker.
- MongoDB Atlas stores users, telemetry history, and alerts.
- AWS Systems Manager Parameter Store holds runtime secrets.
- AWS Systems Manager Session Manager replaces an exposed SSH port.

The simulator uses a 500 ms interval (about 50 telemetry events per second for 25 demo trucks), leaving headroom below Atlas Free's documented operations limit.

## Required values

Create an Atlas database user and an Atlas Free cluster in Mumbai when available. Obtain its `mongodb+srv://` connection string. Do not commit or paste that string into issues, documentation, or chat.

The deployment expects these Parameter Store entries in `ap-south-1`:

| Parameter | Type | Purpose |
| --- | --- | --- |
| `/celsyn/prod/mongodb-uri` | SecureString | Atlas connection string |
| `/celsyn/prod/jwt-secret` | SecureString | Long random signing secret |
| `/celsyn/prod/demo-email` | SecureString | Demo login email |
| `/celsyn/prod/demo-password` | SecureString | Demo login password |
| `/celsyn/prod/client-url` | String | Exact Vercel production origin |

Use a temporary placeholder such as `https://example.com` for `client-url` during the first backend launch. Replace it with the final Vercel URL and restart the stack afterward.

## Launch order

1. Sign into AWS using an IAM/SSO administrator identity, never the root account for daily deployment.
2. Create the five Parameter Store values above.
3. Deploy `deploy/aws/cloudformation.yml` in `ap-south-1` with IAM capability enabled.
4. Add the stack's `ElasticIp` output to Atlas Network Access as a single `/32` address.
5. Wait for `https://<ApiUrl>/api/health` to return successfully.
6. Import the repository into Vercel with root directory `client`, build command `npm run build`, and output directory `dist`.
7. Set `VITE_API_URL` in Vercel to the CloudFormation `ApiUrl` output, then deploy.
8. Update `/celsyn/prod/client-url` with the exact Vercel URL and restart the EC2 instance or Docker stack.
9. Confirm login, live fleet updates, the map, incident updates, and the temperature-excursion demo.

## Updating the backend

Connect with AWS Systems Manager Session Manager, then run:

```sh
cd /opt/celsyn/app
git pull --ff-only origin main
cd deploy/aws
sudo docker compose up -d --build
```

## Cost and safety notes

- The template creates a USD 10 monthly budget with forecasted and actual email alerts. A budget is an alert, not a hard spending cap.
- The EC2 security group exposes only HTTP port 80. CloudFront supplies public HTTPS; port 22 is not opened.
- The EC2 Elastic IP is intentionally stable so Atlas can allowlist one address rather than the entire internet.
- Delete the CloudFormation stack and Vercel project when the demo is no longer needed. Verify that the Elastic IP and Atlas cluster are also gone if they are no longer required.
