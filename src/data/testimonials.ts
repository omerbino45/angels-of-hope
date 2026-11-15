/** Replies from families to letters, shown on the home page. Each string is one paragraph, in the family's own words. */
export interface Testimonial {
  paragraphs: string[]
}

export const testimonials: Testimonial[] = [
  {
    paragraphs: [
      'יהונתן, אין לך מושג עד כמה אתה מחזק ומרגש אותי.',
      'הדרך שבה אתה ממשיך להפיץ את האור ולספר על מי שהגיבורים שלנו היו ועל מה שהם השאירו אחריהם, זה מעניק לנו כוח גדול.',
      'אז תודה לך על זה.',
    ],
  },
  {
    paragraphs: [
      'מגיע לך מילים טובות וחמות על כל מה שאתה עושה וחושב עלינו 🌸',
      'אני בטוחה שכולן מרגישות את התמיכה והחשיבה עלינו.',
      'שרק תדע שאני שומרת את כל המכתבים והציורים. אתמול ישבתי וקראתי את אחד המכתבים.',
    ],
  },
]
