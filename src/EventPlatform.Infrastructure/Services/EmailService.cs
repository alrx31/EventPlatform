using System.Net.Mail;
using EventPlatform.Application.Common.Interfaces;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;

namespace EventPlatform.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendTicketConfirmationAsync(
        string toEmail,
        string userName,
        string eventTitle,
        DateTime eventDate,
        string qrCode,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _configuration["EmailSettings:SenderName"],
            _configuration["EmailSettings:SenderEmail"]!));
        message.To.Add(new MailboxAddress(userName, toEmail));
        message.Subject = $"Your ticket for {eventTitle}";

        var htmlBody = new TextPart("html")
        {
            Text = $"""
                    <h2>Your ticket is confirmed!</h2>
                    <p>Hello {userName},</p>
                    <p>You are registered for <strong>{eventTitle}</strong></p>
                    <p>Date: {eventDate:dddd, MMMM dd yyyy HH:mm} UTC</p>
                    <p>Show this QR code at the entrance:</p>
                    <img src="data:image/png;base64,{qrCode}" width="200" height="200" />
                    <p>See you there!</p>
                    """
        };

        message.Body = htmlBody;

        try
        {
            await SendAsync(message, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Ticket email to {Email} was not sent", toEmail);
        }
    }

    private async Task SendAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(
            _configuration["EmailSettings:SmtpHost"],
            int.Parse(_configuration["EmailSettings:SmtpPort"]!),
            SecureSocketOptions.StartTls,
            cancellationToken);

        await client.AuthenticateAsync(
            _configuration["EmailSettings:Username"],
            _configuration["EmailSettings:Password"],
            cancellationToken);

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken); 
    }
}