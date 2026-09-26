namespace Backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public string DisplayName { get; set; } = "Prof";
}

public class BlogPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Tags { get; set; } = string.Empty; // Comma-separated
    public string RelatedPostIds { get; set; } = string.Empty; // Comma-separated IDs of curated related posts
    public int ReadTimeMinutes { get; set; } = 5;
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class AcademicNote
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty; // e.g. "Distributed Systems", "Operating Systems", "Database Internals"
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int Order { get; set; } = 1;
    public string Content { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("subjects")]
public class Subject
{
    [Key]
    [Column("id")]
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int Id { get; set; }

    [Column("name")]
    [System.Text.Json.Serialization.JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [Column("created_at")]
    [System.Text.Json.Serialization.JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


[Table("questions")]
public class Question
{
    [Key]
    [Column("id", Order = 0)]
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [Column("question_text", Order = 1)]
    [System.Text.Json.Serialization.JsonPropertyName("question_text")]
    public string QuestionText { get; set; } = string.Empty;

    [Column("answer_text", Order = 2)]
    [System.Text.Json.Serialization.JsonPropertyName("answer_text")]
    public string? AnswerText { get; set; }

    [Column("status", Order = 3)]
    [System.Text.Json.Serialization.JsonPropertyName("status")]
    public string Status { get; set; } = "pending";

    [Column("is_anonymous", Order = 4)]
    [System.Text.Json.Serialization.JsonPropertyName("is_anonymous")]
    public bool IsAnonymous { get; set; } = true;

    [Column("asker_name", Order = 5)]
    [System.Text.Json.Serialization.JsonPropertyName("asker_name")]
    public string AskerName { get; set; } = "Anonymous";

    [Column("likes_count", Order = 6)]
    [System.Text.Json.Serialization.JsonPropertyName("likes_count")]
    public int LikesCount { get; set; } = 0;

    [Column("parent_id", Order = 7)]
    [System.Text.Json.Serialization.JsonPropertyName("parent_id")]
    public string? ParentId { get; set; }

    [Column("created_at", Order = 8)]
    [System.Text.Json.Serialization.JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("answered_at", Order = 9)]
    [System.Text.Json.Serialization.JsonPropertyName("answered_at")]
    public DateTime? AnsweredAt { get; set; }

    [Column("display_number", Order = 10)]
    [System.Text.Json.Serialization.JsonPropertyName("display_number")]
    public int? DisplayNumber { get; set; }

    [NotMapped]
    [System.Text.Json.Serialization.JsonPropertyName("parent_question_text")]
    public string? ParentQuestionText { get; set; }
}

[Table("admin_login_attempts")]
public class AdminLoginAttempt
{
    [Key]
    [Column("ip")]
    [System.Text.Json.Serialization.JsonPropertyName("ip")]
    public string Ip { get; set; } = string.Empty;

    [Column("failed_attempts")]
    [System.Text.Json.Serialization.JsonPropertyName("failed_attempts")]
    public int FailedAttempts { get; set; } = 0;

    [Column("locked_until")]
    [System.Text.Json.Serialization.JsonPropertyName("locked_until")]
    public DateTime? LockedUntil { get; set; }

    [Column("updated_at")]
    [System.Text.Json.Serialization.JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("profile")]
public class Profile
{
    [Key]
    [Column("id")]
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int Id { get; set; } = 1;

    [Column("alias_ar")]
    [System.Text.Json.Serialization.JsonPropertyName("alias_ar")]
    public string AliasAr { get; set; } = "بروف";

    [Column("alias_en")]
    [System.Text.Json.Serialization.JsonPropertyName("alias_en")]
    public string AliasEn { get; set; } = "Prof";

    [Column("name_ar")]
    [System.Text.Json.Serialization.JsonPropertyName("name_ar")]
    public string NameAr { get; set; } = "محمود سيد محمد";

    [Column("name_en")]
    [System.Text.Json.Serialization.JsonPropertyName("name_en")]
    public string NameEn { get; set; } = "Mahmoud Sayed Mohamed";

    [Column("bio_ar")]
    [System.Text.Json.Serialization.JsonPropertyName("bio_ar")]
    public string BioAr { get; set; } = "مهندس برمجيات على قد حالي، بحاول أعمل حاجات ليها معنى وتفيدني وتفيد غيري. لو عندك سؤال، رأي، نقد، اقتراح، أو حتى حاجة نفسك تقولها ومش عارف تقولها ازاي. ابعتها، هقراها وهسمعك.";

    [Column("bio_en")]
    [System.Text.Json.Serialization.JsonPropertyName("bio_en")]
    public string BioEn { get; set; } = "I'm Mahmoud, but most people call me Prof. I'm a software developer who likes building things, trying new ideas, and figuring stuff out along the way. If you have a question, opinion, criticism, advice, or just something you want to say — go ahead. I'm listening.";

    [Column("linkedin")]
    [System.Text.Json.Serialization.JsonPropertyName("linkedin")]
    public string Linkedin { get; set; } = "https://www.linkedin.com/in/mahmoud-sayed-mohamed";

    [Column("github")]
    [System.Text.Json.Serialization.JsonPropertyName("github")]
    public string Github { get; set; } = "https://github.com/ixProf";

    [Column("updated_at")]
    [System.Text.Json.Serialization.JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

