/*
 * 실제 출제 문항 수
 *
 * JSON 은 문제은행이라 이 수보다 많이 들어 있다.
 * 시험을 시작할 때 은행에서 이만큼 무작위로 뽑고, 순서도 매번 섞는다.
 * A형 / B형 구분은 출제 단계에서 쓰지 않는다. 과목별 은행 하나에서 뽑는다.
 *
 * 은행에 이보다 적게 있으면 있는 만큼만 출제된다.
 *
 * 수는 HIE-QP-E01(Rev.8) 표 3 "필기시험의 최소 문제 수" 를 그대로 따른다.
 * 예전에는 전 종목을 일반 40, 전문 25 로 못 박아 뒀는데, 표 3 은 종목마다
 * 다르다. 전문시험이 대개 20인데 TOFD·PAUT·CR·DR·FMC 는 30이다. 그래서
 * TOFD·PAUT 전문시험이 규정보다 5문항 적게 나가고 있었다.
 */
export const QUESTION_COUNT = {
  "Level II": {
    General: {
      RT: 40, MT: 40, UT: 40, PT: 40, VT: 40,
      ECT: 40, RFT: 40, TOFD: 40, PAUT: 40,
    },

    /* 표 3 은 전문시험을 종목마다 달리 정한다 */
    Specific: {
      RT: 20, MT: 20, UT: 20, PT: 20, VT: 20,
      ECT: 20, RFT: 20,
      TOFD: 30, PAUT: 30,
    },
  },

  // Level III 는 은행 전체를 출제한다 (뽑지 않고 순서만 섞는다)
  "Level III": null,
};

/*
 * 뽑을 문항 수.
 * level 은 "Level II" / "Level III", subject 는 General / Specific,
 * method 는 종목(UT, TOFD …)이다.
 */
export function questionCount(level, subject, method) {
  const conf = QUESTION_COUNT[level];

  if (typeof conf === "number") return conf;
  if (!conf || !subject) return null;

  const bySubject = conf[subject];

  if (typeof bySubject === "number") return bySubject;
  if (bySubject && method && bySubject[method]) return bySubject[method];

  return null;   // 지정이 없으면 전부 출제
}

const ExamData = {
  "Level II": {
    "General": {
      ECT: {
        file: "data/Level II/General/ECT.json",
      },
      UT: {
        file: "data/Level II/General/UT.json",
      },
      MT: {
        file: "data/Level II/General/MT.json",
      },
      PT: {
        file: "data/Level II/General/PT.json",
      },
      RT: {
        file: "data/Level II/General/RT.json",
      },
      VT: {
        file: "data/Level II/General/VT.json",
      },
      PAUT: {
        file: "data/Level II/General/PAUT.json",
      },
      RFT: {
        file: "data/Level II/General/RFT.json",
      },
      TOFD: {
        file: "data/Level II/General/TOFD.json",
      },
    },

    "Specific": {
      ECT: {
        file: "data/Level II/Specific/ECT.json",
      },
      UT: {
        file: "data/Level II/Specific/UT.json",
      },
      MT: {
        file: "data/Level II/Specific/MT.json",
      },
      PT: {
        file: "data/Level II/Specific/PT.json",
      },
      RT: {
        file: "data/Level II/Specific/RT.json",
      },
      VT: {
        file: "data/Level II/Specific/VT.json",
      },
      PAUT: {
        file: "data/Level II/Specific/PAUT.json",
      },
      RFT: {
        file: "data/Level II/Specific/RFT.json",
      },
      TOFD: {
        file: "data/Level II/Specific/TOFD.json",
      },
    },
  },

  "Level III": {
    Basic: {
      file: "data/Level III/Basic.json",
    },

    MT: {
      file: "data/Level III/MT.json",
    },

    PT: {
      file: "data/Level III/PT.json",
    },

    RT: {
      file: "data/Level III/RT.json",
    },

    UT: {
      file: "data/Level III/UT.json",
    },

    VT: {
      file: "data/Level III/VT.json",
    },
  },
};

export default ExamData;