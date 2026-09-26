using System.Text.Json.Serialization;

namespace Backend.DTOs;

public record LoginRequest(string Username, string Password);

public record AuthResponse(string Token, string Username, string DisplayName);

public record CreateBlogPostRequest(string Title, string Excerpt, string Content, string Tags, int ReadTimeMinutes, string? RelatedPostIds = null);

public record UpdateBlogPostRequest(string Title, string Excerpt, string Content, string Tags, int ReadTimeMinutes, string? RelatedPostIds = null);

public record CreateAcademicNoteRequest(string Subject, string Title, string Content, int Order);

public record UpdateAcademicNoteRequest(string Subject, string Title, string Content, int Order);

public record CreateSubjectRequest(string Name);

public class AskQuestionRequest
{
    [JsonPropertyName("question_text")]
    public string? QuestionTextSnake { get; set; }
    public string? QuestionText { get; set; }

    [JsonPropertyName("asker_name")]
    public string? AskerNameSnake { get; set; }
    public string? AskerName { get; set; }

    [JsonPropertyName("is_anonymous")]
    public bool? IsAnonymousSnake { get; set; }
    public bool? IsAnonymous { get; set; }

    [JsonPropertyName("parent_id")]
    public string? ParentIdSnake { get; set; }
    public string? ParentId { get; set; }

    public string GetQuestionText() => QuestionTextSnake ?? QuestionText ?? string.Empty;
    public string? GetAskerName() => AskerNameSnake ?? AskerName;
    public bool? GetIsAnonymous() => IsAnonymousSnake ?? IsAnonymous;
    public string? GetParentId() => ParentIdSnake ?? ParentId;
}

public record AnswerQuestionRequest(string AnswerText);

public class AdminAuthLoginRequest
{
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

public class AdminAnswerQuestionRequest
{
    [JsonPropertyName("answer_text")]
    public string? AnswerTextSnake { get; set; }
    public string? AnswerText { get; set; }

    public string GetAnswerText() => AnswerTextSnake ?? AnswerText ?? string.Empty;
}
