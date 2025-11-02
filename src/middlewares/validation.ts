// 요청 검증 미들웨어
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Validation 체크 미들웨어
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 모든 validation 실행
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 에러 포맷팅
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: formattedErrors,
    });
  };
};
